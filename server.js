const express = require("express");
const app = express();

// Use process.env.PORT for hosting platforms, fallback to 3000 locally
const PORT = process.env.PORT || 3000;

app.use(express.json());

/**
 * MOCK DATA
 *
 * - changeInStatus is now an ARRAY of strings, e.g. ["Sale", "LowStock"].
 *   Empty array = no active changes (i.e. "nil").
 *
 * - changedAtDate:
 *   - Recent (Dec 2025) => "new" changes.
 *   - Several weeks/months ago (Oct/Sep 2025) => old changes only.
 *
 * - hasUpdates is computed by:
 *   - Any product where:
 *       changeInStatus.length > 0
 *       AND changedAtDate > lastSeenAt
 */

const WISHLISTS = {
  // 111 – NO updates (all changes are old; lastSeenAt is after changes)
  "111": {
    wishlistId: "111",
    lastSeenAt: "2025-12-09T12:30:00Z",
    products: [
      {
        productId: "P11101",
        changeInStatus: [], // nil: no current flags
        changedAtDate: "2025-10-15T09:00:00Z" // ~8 weeks ago
      },
      {
        productId: "P11102",
        changeInStatus: [],
        changedAtDate: "2025-09-17T09:00:00Z" // ~12 weeks ago
      }
    ]
  },

  // 222 – HAS updates: one product now on Sale
  "222": {
    wishlistId: "222",
    lastSeenAt: "2025-12-09T09:00:00Z",
    products: [
      {
        productId: "P22201",
        changeInStatus: ["Sale"], // now on sale
        changedAtDate: "2025-12-10T08:00:00Z"
      },
      {
        productId: "P22202",
        changeInStatus: [], // unchanged since weeks ago
        changedAtDate: "2025-10-15T10:00:00Z"
      }
    ]
  },

  // 333 – HAS updates: one product now LowStock
  "333": {
    wishlistId: "333",
    lastSeenAt: "2025-12-08T18:00:00Z",
    products: [
      {
        productId: "P33301",
        changeInStatus: ["LowStock"],
        changedAtDate: "2025-12-09T23:30:00Z"
      },
      {
        productId: "P33302",
        changeInStatus: [],
        changedAtDate: "2025-11-12T09:15:00Z" // ~4 weeks ago
      }
    ]
  },

  // 444 – HAS updates: combined Sale + LowStock
  "444": {
    wishlistId: "444",
    lastSeenAt: "2025-12-07T10:00:00Z",
    products: [
      {
        productId: "P44401",
        changeInStatus: ["Sale", "LowStock"],
        changedAtDate: "2025-12-09T08:45:00Z"
      },
      {
        productId: "P44402",
        changeInStatus: [],
        changedAtDate: "2025-09-20T11:00:00Z"
      }
    ]
  },

  // 555 – HAS updates: one NoStock, others unchanged (old)
  "555": {
    wishlistId: "555",
    lastSeenAt: "2025-12-05T14:00:00Z",
    products: [
      {
        productId: "P55501",
        changeInStatus: ["NoStock"],
        changedAtDate: "2025-12-09T16:00:00Z"
      },
      {
        productId: "P55502",
        changeInStatus: [],
        changedAtDate: "2025-10-01T10:00:00Z"
      },
      {
        productId: "P55503",
        changeInStatus: [],
        changedAtDate: "2025-09-10T10:00:00Z"
      }
    ]
  },

  // 666 – NO updates: has statuses, but all before lastSeenAt
  "666": {
    wishlistId: "666",
    lastSeenAt: "2025-12-10T09:00:00Z",
    products: [
      {
        productId: "P66601",
        changeInStatus: ["Sale"], // used to be on sale
        changedAtDate: "2025-12-05T12:00:00Z" // BEFORE lastSeenAt
      },
      {
        productId: "P66602",
        changeInStatus: ["LowStock"],
        changedAtDate: "2025-12-01T09:30:00Z"
      }
    ]
  },

  // 777 – HAS updates: BackInStock
  "777": {
    wishlistId: "777",
    lastSeenAt: "2025-12-01T08:00:00Z",
    products: [
      {
        productId: "P77701",
        changeInStatus: ["BackInStock"],
        changedAtDate: "2025-12-08T10:30:00Z"
      },
      {
        productId: "P77702",
        changeInStatus: [], // unchanged, old
        changedAtDate: "2025-09-25T07:45:00Z"
      }
    ]
  },

  // 888 – HAS updates: multiple combined statuses
  "888": {
    wishlistId: "888",
    lastSeenAt: "2025-12-09T06:00:00Z",
    products: [
      {
        productId: "P88801",
        changeInStatus: ["Sale", "BackInStock"],
        changedAtDate: "2025-12-10T07:00:00Z"
      },
      {
        productId: "P88802",
        changeInStatus: ["HighStock"],
        changedAtDate: "2025-12-09T20:15:00Z"
      },
      {
        productId: "P88803",
        changeInStatus: [],
        changedAtDate: "2025-10-10T09:00:00Z"
      }
    ]
  },

  // 999 – NO updates, empty wishlist
  "999": {
    wishlistId: "999",
    lastSeenAt: "2025-12-09T12:00:00Z",
    products: [] // nothing in wishlist
  },

  // 1000 – MIXED: one updated, one old, one nil
  "1000": {
    wishlistId: "1000",
    lastSeenAt: "2025-12-08T12:00:00Z",
    products: [
      {
        productId: "P100001",
        changeInStatus: ["Sale"],
        changedAtDate: "2025-12-09T13:00:00Z" // NEW
      },
      {
        productId: "P100002",
        changeInStatus: ["LowStock"],
        changedAtDate: "2025-11-01T09:00:00Z" // old
      },
      {
        productId: "P100003",
        changeInStatus: [], // nil
        changedAtDate: "2025-10-05T09:00:00Z"
      }
    ]
  }
};

/**
 * GET /wishlist/:wishlistId/updates
 *
 * - hasUpdates = true if ANY product has:
 *      changeInStatus.length > 0
 *      AND changedAtDate > lastSeenAt
 * - updatedProducts = just those products.
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

  const lastSeen = new Date(wishlist.lastSeenAt || 0);

  const updatedProducts = (wishlist.products || []).filter((p) => {
    if (!Array.isArray(p.changeInStatus) || p.changeInStatus.length === 0) {
      // "nil" changes
      return false;
    }
    if (!p.changedAtDate) return false;

    const changedAt = new Date(p.changedAtDate);
    return changedAt > lastSeen;
  });

  const hasUpdates = updatedProducts.length > 0;

  res.json({
    wishlistId: wishlist.wishlistId,
    lastSeenAt: wishlist.lastSeenAt,
    products: wishlist.products,
    hasUpdates,
    updatedProducts
  });
});

/**
 * POST /wishlist/:wishlistId/view
 * - simulate "customer views wishlist", updating lastSeenAt to now.
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
  console.log(`Mock WishlistService running on port ${PORT}`);
});