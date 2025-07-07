# Supermemory Operator CLI

This package provides a command-line interface for common Supermemory maintenance tasks.

## Installation

Run the build script and link the binary:

```bash
bun install && bun run build
bun link
```

## Usage

Create a new user:

```bash
supermemory-operator create-user user@example.com
```

List documents for a user:

```bash
supermemory-operator list-documents <userId> --sort created
supermemory-operator list-documents <userId> --sort title --desc
```

List all users:

```bash
supermemory-operator list-users
```

Create a space for a user:

```bash
supermemory-operator create-space <userId> "My Space" --public
```

List spaces for a user:

```bash
supermemory-operator list-spaces <userId>
```

Delete a user:
```bash
supermemory-operator delete-user <userId>
```

Delete a space:
```bash
supermemory-operator delete-space <spaceId>
```

Update a space:
```bash
supermemory-operator update-space <spaceId> -n "New Name" --public true
```

Add an email to the waitlist:
```bash
supermemory-operator add-waitlist someone@example.com
```

List waitlist entries:
```bash
supermemory-operator list-waitlist
supermemory-operator add-space-member <spaceId> <userId>
supermemory-operator remove-space-member <spaceId> <userId>
supermemory-operator list-space-members <spaceId>

supermemory-operator remove-waitlist <email>
supermemory-operator create-document <userId> <url> --title "Title"
supermemory-operator delete-document <documentId>
supermemory-operator update-document <documentId> --title "New Title"
supermemory-operator update-user <userId> --email new@example.com
supermemory-operator add-document-space <documentId> <spaceId>
supermemory-operator remove-document-space <documentId> <spaceId>
supermemory-operator show-user <userId>
supermemory-operator show-document <documentId>
supermemory-operator show-space <spaceId>
supermemory-operator list-space-documents <spaceId>
```

Ensure `DATABASE_URL` is set in your environment before running commands.
