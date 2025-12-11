const express = require("express");
const cors = require("cors");

const app = express();

// IMPORTANT: use env PORT if deployed, fallback for local
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * Mock data representing:
 * - WishlistDb: lastSeenAt, products in wishlist
 * - ProductTrackerService: per-product change info
 *
 * changeInStatus is now an ARRAY of strings, e.g.:
 *   ["Sale"]
 *   ["Sale", "LowStock"]
 *   []
 *
 * For "unchanged" products, changeInStatus = [] (nil) and
 * changedAtDate is several weeks/months ago.
 *
 * Today is assumed to be: 2025-12-10
 */

const WISHLISTS = {
  // 101: No updates at all
  "101": {
    wishlistId: "101",
    lastSeenAt: "2025-12-09T12:30:00Z",
    products: ["P10101", "P10102", "P10103"],
    updates: []
  },

  // 102: Single product, single status = "Sale"
  "102": {
    wishlistId: "102",
    lastSeenAt: "2025-12-09T09:00:00Z",
    products: ["P10201", "P10202"],
    updates: [
      {
        productId: "P10201",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-10T08:15:00Z"
      }
    ]
  },

  // 103: Single product, multiple statuses: "Sale" + "LowStock"
  "103": {
    wishlistId: "103",
    lastSeenAt: "2025-12-08T10:00:00Z",
    products: ["P10301", "P10302"],
    updates: [
      {
        productId: "P10302",
        changeInStatus: ["Sale", "LowStock"],
        changedAtDate: "2025-12-09T18:45:00Z"
      }
    ]
  },

  // 104: Multiple products, different statuses
  "104": {
    wishlistId: "104",
    lastSeenAt: "2025-12-07T16:00:00Z",
    products: ["P10401", "P10402", "P10403"],
    updates: [
      {
        productId: "P10401",
        changeInStatus: ["NoStock"],
        changedAtDate: "2025-12-09T11:00:00Z"
      },
      {
        productId: "P10403",
        changeInStatus: ["BackInStock"],
        changedAtDate: "2025-12-10T07:20:00Z"
      }
    ]
  },

  // 105: Product changed many weeks ago (8 weeks ago)
  //      still counts as an update vs lastSeenAt
  "105": {
    wishlistId: "105",
    lastSeenAt: "2025-11-01T09:00:00Z",
    products: ["P10501", "P10502"],
    updates: [
      {
        productId: "P10502",
        changeInStatus: ["HighStock"],
        // ~8 weeks before 2025-12-10
        changedAtDate: "2025-10-15T10:00:00Z"
      }
    ]
  },

  // 106: Product went from sale back to normal: "NotOnSale"
  "106": {
    wishlistId: "106",
    lastSeenAt: "2025-12-09T20:00:00Z",
    products: ["P10601"],
    updates: [
      {
        productId: "P10601",
        changeInStatus: ["NotOnSale"],
        changedAtDate: "2025-12-10T06:30:00Z"
      }
    ]
  },

  // 107: Multiple products, mixed multi-status permutations
  "107": {
    wishlistId: "107",
    lastSeenAt: "2025-12-05T13:00:00Z",
    products: ["P10701", "P10702", "P10703"],
    updates: [
      {
        productId: "P10701",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-09T09:30:00Z"
      },
      {
        productId: "P10702",
        changeInStatus: ["LowStock", "Sale"],
        changedAtDate: "2025-12-09T09:45:00Z"
      },
      {
        productId: "P10703",
        changeInStatus: ["NoStock", "HighStock"],
        changedAtDate: "2025-12-08T14:20:00Z"
      }
    ]
  },

  // 108: Contains a product that hasn't changed recently:
  //      changeInStatus is empty, changedAtDate months ago
  "108": {
    wishlistId: "108",
    lastSeenAt: "2025-12-09T10:00:00Z",
    products: ["P10801", "P10802"],
    updates: [
      {
        // changed recently, a genuine update
        productId: "P10801",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-10T09:00:00Z"
      },
      {
        // unchanged: no effective status change and old timestamp
        productId: "P10802",
        changeInStatus: [],
        // ~12 weeks before 2025-12-10
        changedAtDate: "2025-09-17T10:00:00Z"
      }
    ]
  },

  // 109: All products unchanged (nil changes),
  //      last "change" many weeks ago
  "109": {
    wishlistId: "109",
    lastSeenAt: "2025-12-10T08:00:00Z",
    products: ["P10901", "P10902"],
    updates: [
      {
        productId: "P10901",
        changeInStatus: [],
        // ~4 weeks before 2025-12-10
        changedAtDate: "2025-11-12T12:00:00Z"
      },
      {
        productId: "P10902",
        changeInStatus: [],
        // ~6 weeks before 2025-12-10
        changedAtDate: "2025-10-29T09:30:00Z"
      }
    ]
  },

  // 110: Edge case: one product with multiple statuses,
  //      another unchanged from long ago
  "110": {
    wishlistId: "110",
    lastSeenAt: "2025-12-06T18:00:00Z",
    products: ["P11001", "P11002"],
    updates: [
      {
        productId: "P11001",
        changeInStatus: ["BackInStock", "Sale"],
        changedAtDate: "2025-12-09T21:10:00Z"
      },
      {
        productId: "P11002",
        changeInStatus: [],
        // ~10 weeks before 2025-12-10
        changedAtDate: "2025-10-01T11:11:00Z"
      }
    ]
  }
};

/**
 * Helper: get only the products that actually have real changes
 * (i.e. changeInStatus array is non-empty).
 */
function getChangedProducts(updates) {
  if (!Array.isArray(updates)) return [];
  return updates.filter(
    (u) =>
      Array.isArray(u.changeInStatus) && u.changeInStatus.length > 0
  );
}

/**
 * GET /wishlist/:wishlistId/updates
 *
 * Returns whether the wishlist has updates and, if so,
 * the per-product change attributes.
 *
 * Example response:
 * {
 *   "wishlistId": "102",
 *   "lastSeenAt": "2025-12-09T09:00:00Z",
 *   "hasUpdates": true,
 *   "updatedProducts": [
 *     {
 *       "productId": "P10201",
 *       "changeInStatus": ["Sale"],
 *       "changedAtDate": "2025-12-10T08:15:00Z"
 *     }
 *   ],
 *   "allProducts": ["P10201", "P10202"]
 * }
 */
app.get("/wishlist/:wishlistId/updates", (req, res) => {
  const { wishlistId } = req.params;
  const wishlist = WISHLISTS[wishlistId];

  if (!wishlist) {
    return res.status(404).json({
      error: "Wishlist not found",
      wishlistId
    });
  }

  const changedProducts = getChangedProducts(wishlist.updates);
  const hasUpdates = changedProducts.length > 0;

  res.json({
    wishlistId: wishlist.wishlistId,
    lastSeenAt: wishlist.lastSeenAt,
    hasUpdates,
    updatedProducts: changedProducts,
    allProducts: wishlist.products
  });
});

/**
 * POST /wishlist/:wishlistId/view
 * Simulate viewing the wishlist and updating the lastSeenAt date.
 */
app.post("/wishlist/:wishlistId/view", (req, res) => {
  const { wishlistId } = req.params;
  const wishlist = WISHLISTS[wishlistId];

  if (!wishlist) {
    return res.status(404).json({
      error: "Wishlist not found",
      wishlistId
    });
  }

  const now = new Date().toISOString();
  wishlist.lastSeenAt = now;

  res.json({
    wishlistId: wishlist.wishlistId,
    lastSeenAt: wishlist.lastSeenAt,
    message: "Wishlist last seen date updated"
  });
});

app.listen(PORT, () => {
  console.log(`Mock WishlistService running on http://localhost:${PORT}`);
});