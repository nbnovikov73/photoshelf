# API Guide

API responses must be consistent.

Success:

```json
{ "ok": true, "data": {} }
```

Error:

```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "Human-readable message" } }
```

Validate all input. Return clear errors. Do not expose stack traces. Protect mutation routes.
