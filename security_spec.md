# Security Specification & "Dirty Dozen" Test Spec for Planning Petit Déj

## 1. Data Invariants
1. **Team Ownership and Access**: Only members of a team can read or write documents inside `/teams/{teamId}` and any of its subcollections (`colleagues` and `absences`).
2. **User Profiles Isolation**: A user's private data (`/users/{userId}/private/info`) is strictly readable only by the owner `userId`. Public profiles can be looked up by authenticated users in order to manage active team memberships and verify identity.
3. **Immutable History & Identity**: Whichever user creates a team (`ownerId`) or user profile must match their authenticated ID. The `createdAt`/`updatedAt` fields must match server-time stamps.

---

## 2. The "Dirty Dozen" Penetration-Test Payloads
Here are the 12 malicious payloads designed to bypass the rules, which must all return `PERMISSION_DENIED`.

### Attack 1: Self-Promote / Role Spoofing (Users Info Bypass)
* **Goal**: An attacker attempts to write directly into someone else's user info profile or write extra admin attributes.
* **Payload**: `setDoc('/users/malicious_user/private/info', { email: 'fake_boss@corp.com', isAdmin: true })` by user `attacker123`.
* **Expectation**: `PERMISSION_DENIED` - UID must match `request.auth.uid`.

### Attack 2: Read PII of Another User (PII Leak)
* **Goal**: Read another user's isolated private data directory.
* **Payload**: `getDoc('/users/other_user_id/private/info')` by user `attacker123`.
* **Expectation**: `PERMISSION_DENIED` - Private PII read is locked to the owner only.

### Attack 3: Hijack Team Ownership (Identity Spoofing)
* **Goal**: Create a team but set another user as the owner or set yourself as owner of a team you didn't create.
* **Payload**: `setDoc('/teams/team99', { name: "Fake Business", ownerId: "admin_uid", settings: {...}, overrides: {} })` by user `attacker123`.
* **Expectation**: `PERMISSION_DENIED` - `incoming().ownerId` must match the authenticated `request.auth.uid`.

### Attack 4: Shadow Update (Ghost Field Injection)
* **Goal**: Send excessive unverified variables inside a team document to pollute memory or inject hidden control variables.
* **Payload**: `updateDoc('/teams/teamA', { name: "New Name", isUnlimitedCreditCardEnabled: true })`
* **Expectation**: `PERMISSION_DENIED` - Blocked by `affectedKeys().hasOnly(['name', 'settings', 'overrides', 'updatedAt'])`.

### Attack 5: Resource Poisoning via Document IDS
* **Goal**: Create a colleague with a massive 1MB string or high-character key to cause a Denial of Wallet or layout crash.
* **Payload**: `setDoc('/teams/teamA/colleagues/very-long-junk-and-malformed-characters-blah-blah...', { id: '...', name: 'X', color: 'rose', isActive: true, initialCount: 0 })`
* **Expectation**: `PERMISSION_DENIED` - Document id must match `isValidId()`.

### Attack 6: Unauthenticated Scraping (PII Blanket Test)
* **Goal**: Read teams information without being logged in.
* **Payload**: `getDoc('/teams/teamA')` by an anonymous/unauthenticated user.
* **Expectation**: `PERMISSION_DENIED` - User must be authenticated and email verified.

### Attack 7: Counter Spoof / Fairness Polarity Attack
* **Goal**: Setting colleague rotation counts to a negative or excessively high number to break the scheduling fairness.
* **Payload**: `updateDoc('/teams/teamA/colleagues/col1', { initialCount: -500 })` or `{ initialCount: 999999 }`.
* **Expectation**: `PERMISSION_DENIED` - Validations constraint: `initialCount >= 0 && initialCount <= 20`.

### Attack 8: Overlap/Absence Poisoning (Temporal Violation)
* **Goal**: Create an absence with a start date that is after the end date.
* **Payload**: `setDoc('/teams/teamA/absences/abs1', { id: 'abs1', colleagueId: 'c1', startDate: '2026-12-31', endDate: '2026-01-01' })`.
* **Expectation**: `PERMISSION_DENIED` - `startDate <= endDate`.

### Attack 9: Immutable Key Hijack (Owner Alteration)
* **Goal**: Change the owner of an existing team from its creator to an attacker.
* **Payload**: `updateDoc('/teams/teamA', { ownerId: 'attacker123' })` by a non-owner.
* **Expectation**: `PERMISSION_DENIED`.

### Attack 10: Client-Side Query Trust Bypass (Collection Scraping)
* **Goal**: Run a query for all teams without filtering, scraping other shifts’ rosters.
* **Payload**: `getDocs(collection('/teams'))` where rules don't check row-level rights.
* **Expectation**: `PERMISSION_DENIED` - `allow list` must check team membership or ownership.

### Attack 11: Future/Past Stamp Abuse (Temporal Exploitation)
* **Goal**: Send custom epoch or future timestamps to freeze the `updatedAt` property in history.
* **Payload**: `updateDoc('/teams/teamA', { updatedAt: '2050-01-01T00:00:00Z' })`
* **Expectation**: `PERMISSION_DENIED` - Must equal `request.time`.

### Attack 12: Orphaned Absence Insertion
* **Goal**: Create an absence entry on a colleague who is not a member of the team.
* **Payload**: `setDoc('/teams/teamA/absences/absX', { colleagueId: 'nonexistent', ... })`
* **Expectation**: `PERMISSION_DENIED` - Handled by validating that the colleague document exists in the subcollection.

---

## 3. Test Suite Outline
These invariants are hard-coded into our security rules in `/firestore.rules`.
All operations on the client-side must capture errors and throw a structured error using the `FirestoreErrorInfo` layout.
