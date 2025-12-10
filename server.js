const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Mock data – pretending to be our WishlistDb + ProductTrackerService combo.
 *
 * changeInStatus is now an ARRAY of statuses to allow multiple changes, e.g.:
 *   ["Sale", "LowStock"]
 *
 * Valid example statuses:
 *   "Sale", "NotOnSale", "NoStock", "LowStock", "BackInStock", "HighStock"
 */

const WISHLISTS = {
  // 1. No updates (hasUpdates = false)
  "111": {
    wishlistId: "111",
    lastSeenAt: "2025-12-09T12:30:00Z",
    products: ["P10001", "P10002"],
    updates: []
  },

  // 2. Single product, single status change
  "222": {
    wishlistId: "222",
    lastSeenAt: "2025-12-08T09:00:00Z",
    products: ["P20001", "P20002", "P20003"],
    updates: [
      {
        productId: "P20001",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-09T10:15:00Z"
      }
    ]
  },

  // 3. Multiple products, mixed single + multiple statuses
  "333": {
    wishlistId: "333",
    lastSeenAt: "2025-12-07T08:00:00Z",
    products: ["P30001", "P30002", "P30003", "P30004"],
    updates: [
      {
        productId: "P30001",
        changeInStatus: ["LowStock"],
        changedAtDate: "2025-12-09T09:30:00Z"
      },
      {
        productId: "P30003",
        changeInStatus: ["Sale", "LowStock"],
        changedAtDate: "2025-12-09T11:00:00Z"
      }
    ]
  },

  // 4. Product went from sale back to normal
  "444": {
    wishlistId: "444",
    lastSeenAt: "2025-12-06T15:20:00Z",
    products: ["P40001"],
    updates: [
      {
        productId: "P40001",
        changeInStatus: ["NotOnSale"],
        changedAtDate: "2025-12-09T16:45:00Z"
      }
    ]
  },

  // 5. Product went out of stock
  "555": {
    wishlistId: "555",
    lastSeenAt: "2025-12-06T10:00:00Z",
    products: ["P50001", "P50002"],
    updates: [
      {
        productId: "P50002",
        changeInStatus: ["NoStock"],
        changedAtDate: "2025-12-09T13:10:00Z"
      }
    ]
  },

  // 6. Product came back in stock AND is on sale
  "666": {
    wishlistId: "666",
    lastSeenAt: "2025-12-05T09:00:00Z",
    products: ["P60001", "P60002", "P60003"],
    updates: [
      {
        productId: "P60001",
        changeInStatus: ["BackInStock", "Sale"],
        changedAtDate: "2025-12-09T12:00:00Z"
      }
    ]
  },

  // 7. High stock (e.g. removed low-stock warning)
  "777": {
    wishlistId: "777",
    lastSeenAt: "2025-12-04T18:30:00Z",
    products: ["P70001", "P70002", "P70003"],
    updates: [
      {
        productId: "P70003",
        changeInStatus: ["HighStock"],
        changedAtDate: "2025-12-09T14:25:00Z"
      }
    ]
  },

  // 8. Multiple products, some with multiple flags
  "888": {
    wishlistId: "888",
    lastSeenAt: "2025-12-03T11:45:00Z",
    products: ["P80001", "P80002", "P80003", "P80004"],
    updates: [
      {
        productId: "P80001",
        changeInStatus: ["Sale", "HighStock"],
        changedAtDate: "2025-12-09T09:10:00Z"
      },
      {
        productId: "P80004",
        changeInStatus: ["LowStock"],
        changedAtDate: "2025-12-09T09:50:00Z"
      }
    ]
  },

  // 9. No updates again (another hasUpdates = false example)
  "999": {
    wishlistId: "999",
    lastSeenAt: "2025-12-02T08:00:00Z",
    products: ["P90001"],
    updates: []
  },

  // 10. Everything happened: low stock, then sale, then back in stock (combined)
  "1010": {
    wishlistId: "1010",
    lastSeenAt: "2025-12-01T07:30:00Z",
    products: ["P100001", "P100002"],
    updates: [
      {
        productId: "P100001",
        changeInStatus: ["LowStock", "Sale", "BackInStock"],
        changedAtDate: "2025-12-09T17:05:00Z"
      },
      {
        productId: "P100002",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-09T17:10:00Z"
      }
    ]
  }
};

/**
 * GET /wishlist/:wishlistId/updates
 *
 * Returns whether the wishlist has updates and, if so,
 * the per-product change attributes.
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

  const hasUpdates = wishlist.updates && wishlist.updates.length > 0;

  res.json({
    wishlistId: wishlist.wishlistId,
    lastSeenAt: wishlist.lastSeenAt,
    hasUpdates,
    updatedProducts: wishlist.updates
  });
});

/**
 * POST /wishlist/:wishlistId/view
 *
 * Simulates "view wishlist" and updates lastSeenAt in our mock db.
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