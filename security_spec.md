# Security Specification - SupplyX

## Data Invariants
1. A Chat must have the current user as one of the participants.
2. A Message must belong to a Chat where the user is a participant.
3. A Truck must be owned by the user creating/updating it.
4. A Load must be assigned to the carrier (user) creating/updating it.
5. A User profile can only be written by the owner.
6. A Notification can only be read/written by the target user.

## The "Dirty Dozen" Payloads (Red Team)

1. **Identity Spoofing (User):** Attempt to update another user's profile.
2. **Privilege Escalation (User):** Attempt to set `isAdmin: true` on own profile.
3. **Identity Spoofing (Chat):** Create a chat where I am not a participant.
4. **Chat Hijacking:** Read messages from a chat I am not in.
5. **Message Forgery:** Send a message as another user.
6. **Resource Poisoning (Truck):** Create a truck with a 1MB string in `model`.
7. **The "Ghost" Write:** Update a truck's `ownerId` to someone else.
8. **Load Hijacking:** Update a load's status for a load I don't "carry".
9. **Notification Snooping:** Read notifications for another `userId`.
10. **Product Tampering:** Update a product I don't own (not the `supplierId`).
11. **Shadow Update (Product):** Update a product with a `discount: 99%` field that shouldn't exist.
12. **Immortal Field Breach:** Try to update a document's `createdAt` timestamp.

## Verification Criteria
All "Dirty Dozen" payloads must return `PERMISSION_DENIED`.
Rules must use `isValid[Entity]` and `affectedKeys().hasOnly()`.
