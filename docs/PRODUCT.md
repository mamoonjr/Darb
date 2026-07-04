# Darb — Product Overview



## What is Darb?



**Darb** (درب) is a ride-hailing mobile application for the MENA region, similar to Uber/Careem. The name means "path" or "way" in Arabic.



## User Roles



1. **Rider** — Requests rides on map, pays, tracks driver GPS, rates driver

2. **Driver** — Accepts paid rides, broadcasts live location, manages ride lifecycle

3. **Admin** — Dashboard for stats, users, rides, and active drivers



## Core User Flows



### Rider Flow

1. Register / Login

2. Select pickup & dropoff on Google Maps

3. Request ride → pay (card / Mada / Apple Pay)

4. Wait for driver acceptance (push notification)

5. Track driver location on map in real-time

6. Complete ride → rate driver 1–5 stars



### Driver Flow

1. Register as driver (with vehicle info)

2. Go online (toggle availability)

3. See paid ride requests

4. Accept → GPS tracking starts automatically

5. Mark arrived → start → complete



### Admin Flow

1. Login at admin dashboard (`admin@darb.app`)

2. View stats, revenue, active drivers

3. Manage users (suspend/activate)

4. Monitor all rides



## Tech Stack



| Layer   | Technology                          |

|---------|-------------------------------------|

| Backend | Node.js, Express, Prisma, PostgreSQL|

| Real-time | Socket.io                         |

| Mobile  | Expo, React Native, react-native-maps|

| Push    | Expo Notifications + Push API     |

| Payments| Mock gateway (Stripe/Tap ready)   |

| Admin   | React + Vite                      |

| i18n    | i18next (Arabic default, English) |

| Auth    | JWT + bcrypt                      |



## Feature Status



| Feature | Status |

|---------|--------|

| Auth & roles | ✅ |

| Ride lifecycle | ✅ |

| Google Maps | ✅ |

| GPS tracking | ✅ |

| Electronic payments | ✅ (mock) |

| Push notifications | ✅ |

| Rating system | ✅ |

| Admin dashboard | ✅ |

| PostgreSQL production | ✅ |

