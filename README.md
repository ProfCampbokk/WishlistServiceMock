# 📦 Wishlist Service Mock

A lightweight mock Wishlist Update API used for simulating backend behaviour for SAPFE/SAPBE during wishlist update checks.

This service exposes REST endpoints that return whether a wishlist has updates, along with the status changes for each product.

It includes 10 fully-defined example wishlists, each with different permutations of:
	•	Products on sale
	•	Low stock / out of stock
	•	Back in stock
	•	High stock
	•	Products with no changes (changeInStatus: [])
	•	Products whose last change was weeks/months ago
	•	Mixed multi-status changes

Designed for frontend integrations, demos, and testing.

⸻

# 🚀 Running locally

npm install
npm start

This runs the server on:

http://localhost:3000


⸻

# 📡 API Endpoints

## 1. Check wishlist updates

GET /wishlist/:wishlistId/updates

Returns:

{
  "wishlistId": "102",
  "lastSeenAt": "2025-12-09T09:00:00Z",
  "hasUpdates": true,
  "updatedProducts": [
    {
      "productId": "P10201",
      "changeInStatus": ["Sale"],
      "changedAtDate": "2025-12-10T08:15:00Z"
    }
  ],
  "allProducts": ["P10201", "P10202"]
}


⸻

## 2. Mark wishlist as viewed

POST /wishlist/:wishlistId/view

Updates lastSeenAt to now.

⸻

# 📖 Wishlist Example Scenarios

Below are the 10 example wishlist IDs included in the mock service.
Each ID illustrates a different real-world scenario for product change detection.

⸻

## 🟩 101 — No updates at all

ID	Description
101	Products unchanged; no sale, stock, or availability changes.

Call:

GET /wishlist/101/updates


⸻

## 🟦 102 — Single product on Sale

ID	Description
102	One product now on Sale since last seen.

Status example:
["Sale"]

Call:

GET /wishlist/102/updates


⸻

## 🟧 103 — Multiple statuses: Sale + LowStock

ID	Description
103	A product has two simultaneous updates: on Sale and LowStock.

Status example:
["Sale", "LowStock"]

Call:

GET /wishlist/103/updates


⸻

## 🟥 104 — Multiple products, different change types

ID	Description
104	One product out of stock; another came back in stock.

Statuses include:
	•	["NoStock"]
	•	["BackInStock"]

Call:

GET /wishlist/104/updates


⸻

## 🟨 105 — Old updates (8 weeks ago)

ID	Description
105	Product changed long ago but still counts as update relative to lastSeenAt.

Status example:
["HighStock"]

Call:

GET /wishlist/105/updates


⸻

## 🟪 106 — Product no longer on sale

ID	Description
106	Product moved from Sale → NotOnSale.

Status example:
["NotOnSale"]

Call:

GET /wishlist/106/updates


⸻

## 🟫 107 — Multiple products, mixed multi-status updates

ID	Description
107	Complex scenario with Sale, LowStock, NoStock, HighStock combinations.

Examples:
	•	["Sale"]
	•	["LowStock","Sale"]
	•	["NoStock","HighStock"]

Call:

GET /wishlist/107/updates


⸻

## 🟦 108 — Mixed: one updated, one unchanged (nil)

ID	Description
108	One product updated recently; another unchanged since months ago.

Status examples:
	•	Updated: ["Sale"]
	•	Unchanged: [] (nil)

Call:

GET /wishlist/108/updates


⸻

## ⚪ 109 — All products unchanged (nil changes)

ID	Description
109	All changes are old and have no active statuses.

Status example:
[]

Call:

GET /wishlist/109/updates


⸻

## 🟩 110 — Edge case: Multi-status + unchanged

ID	Description
110	One product with multiple new updates, another with none.

Examples:
	•	Updated: ["BackInStock","Sale"]
	•	Unchanged: []

Call:

GET /wishlist/110/updates


⸻

# 🧪 Quick test commands

curl http://localhost:3000/wishlist/101/updates
curl http://localhost:3000/wishlist/102/updates
curl http://localhost:3000/wishlist/103/updates
curl http://localhost:3000/wishlist/104/updates
curl http://localhost:3000/wishlist/105/updates
curl http://localhost:3000/wishlist/106/updates
curl http://localhost:3000/wishlist/107/updates
curl http://localhost:3000/wishlist/108/updates
curl http://localhost:3000/wishlist/109/updates
curl http://localhost:3000/wishlist/110/updates


⸻

# 🌐 Deploying

Use any Node-compatible host:
	•	Render (recommended)
	•	Railway
	•	Fly.io
	•	Heroku
	•	Local Docker

Your server.js already supports hosting platforms via:

const PORT = process.env.PORT || 3000;

After deployment, replace localhost:3000 with your public URL.