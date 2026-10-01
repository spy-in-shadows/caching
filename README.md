# Express Product Catalog with Layered Caching & Invalidation

This project implements a layered Express application providing product endpoints with in-memory caching, 1-minute TTL, cache hit/miss headers, and automatic cache invalidation upon data mutation.

## Layered Architecture

The application strictly follows the layered architecture:
```
Route → Middleware → Controller → Service → Database
```

### Folder Organization

- **`routes/`**: Defines HTTP routes and attaches middleware to controllers (`productRoutes.js`, `index.js`).
- **`middleware/`**: Contains request interceptors:
  - `cacheMiddleware`: Checks in-memory cache for GET endpoints, evaluates 1-minute TTL, sets `X-Cache: HIT` or `X-Cache: MISS`, and captures fresh responses.
  - `invalidateCacheMiddleware`: Intercepts mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) and clears stale cache entries upon successful (2xx) modification.
- **`controllers/`**: Extracts HTTP parameters, coordinates with the service layer, and returns HTTP responses with appropriate status codes (`productController.js`).
- **`services/`**: Encapsulates business logic, input validation, and communication with the database (`productService.js`, `cacheService.js`).
- **`database/`**: Low-level data access layer responsible for reading and writing to `db.json` (`db.js`).

---

## Features

### 1. In-Memory Caching for GET Endpoints
- `GET /products`: Retrieves all products. Cached after the initial request.
- `GET /products/:id`: Retrieves a single product by ID. Cached after the initial request.

### 2. Cache HIT & MISS Headers
Every GET request returns an `X-Cache` header:
- `X-Cache: HIT` – Served directly from in-memory cache.
- `X-Cache: MISS` – Data was fetched fresh from the database (either not cached yet or expired).

### 3. Time To Live (TTL) of 1 Minute
- The exact creation timestamp (`createdAt`) is stored with every cache entry.
- When a cached value is requested, the system evaluates if `Date.now() - createdAt > 60000ms`.
- If expired, the stale entry is discarded, `X-Cache: MISS` is set, fresh data is fetched from the database, and stored back into the cache with a new timestamp.

### 4. Mutation & Automatic Cache Invalidation
Whenever stored data is successfully modified, all cache entries that may contain stale data are invalidated:
- `POST /products`: Creates a new product.
- `PUT /products/:id`: Replaces/updates an existing product.
- `PATCH /products/:id`: Partially updates an existing product.
- `DELETE /products/:id`: Deletes an existing product.

---

## API Endpoints

| Method | Endpoint | Description | Cache Behavior |
|--------|----------|-------------|----------------|
| `GET` | `/products` | List all products | Cached (1 min TTL, `X-Cache` header) |
| `GET` | `/products/:id` | Get product by ID | Cached (1 min TTL, `X-Cache` header) |
| `POST` | `/products` | Create a new product | Invalidates stale cache on 201 |
| `PUT` | `/products/:id` | Full update product | Invalidates stale cache on 200 |
| `PATCH` | `/products/:id` | Partial update product | Invalidates stale cache on 200 |
| `DELETE` | `/products/:id` | Delete product | Invalidates stale cache on 200 |

---

## Running the Application

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm start
```
Server runs on port `3000` by default.

### Development Mode (with nodemon)
```bash
npm run dev
```

### Run Automated Tests
```bash
npm test
```
Runs the full suite verifying cache HIT/MISS headers, TTL expiration, invalidation on mutations, and database persistence.
