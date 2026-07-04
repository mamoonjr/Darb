# Darb API Documentation



## Base URL



```

http://localhost:3000/api

```



## Authentication



All protected routes require:



```

Authorization: Bearer <jwt_token>

```



## WebSocket



Connect to `http://localhost:3000` with auth:



```js

io('http://localhost:3000', { auth: { token: '<jwt>' } });

```



### Events



| Event            | Direction | Payload                    |

|------------------|-----------|----------------------------|

| ride:join        | client→server | rideId                 |

| ride:leave       | client→server | rideId                 |

| ride:requested   | server→all  | Ride object              |

| ride:accepted    | server→all  | Ride object              |

| ride:updated     | server→room | Ride object              |

| driver:location  | bidirectional | { rideId, driverId, lat, lng } |



## Ride Status Flow



```

REQUESTED → (pay) → ACCEPTED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED → (rate)

                ↘ CANCELLED (from most states)

```



## Endpoints



### Auth



| Method | Path | Description |

|--------|------|-------------|

| POST | /auth/register | Register rider or driver |

| POST | /auth/login | Login |

| GET | /auth/me | Current user profile |



### Users



| Method | Path | Description |

|--------|------|-------------|

| PATCH | /users/push-token | Register Expo push token |



### Rides



| Method | Path | Description |

|--------|------|-------------|

| POST | /rides | Create ride (rider) |

| GET | /rides | List rides |

| GET | /rides/:id | Ride details |

| POST | /rides/:id/accept | Accept ride (driver, requires PAID) |

| PATCH | /rides/:id/status | Update status |

| POST | /rides/:id/pay | Process payment (rider) |

| GET | /rides/:id/payment | Payment status |

| POST | /rides/:id/rate | Rate driver 1-5 (rider, after COMPLETED) |



### Driver



| Method | Path | Description |

|--------|------|-------------|

| PATCH | /driver/location | Update GPS location |

| PATCH | /driver/availability | Go online/offline |



### Admin



| Method | Path | Description |

|--------|------|-------------|

| GET | /admin/stats | Dashboard statistics |

| GET | /admin/users | List users |

| PATCH | /admin/users/:id/toggle | Suspend/activate user |

| GET | /admin/rides | List all rides |

| GET | /admin/drivers/active | Online drivers with GPS |



## Environment Variables



See `backend/.env.example`.



## Database



PostgreSQL via Docker:



```bash

docker compose up -d

cd backend && npm run db:setup

```

