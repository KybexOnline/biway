package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// params holds the configuration for Argon2id.
type params struct {
	memory      uint32 // Memory in KiB
	iterations  uint32 // Number of passes
	parallelism uint8  // Number of threads
	saltLength  uint32 // Length of the random salt in bytes
	keyLength   uint32 // Length of the generated hash in bytes
}

// OWASP recommended default parameters for Argon2id
var defaultParams = &params{
	memory:      64 * 1024, // 64 MB
	iterations:  1,
	parallelism: 2, // 2 threads
	saltLength:  16,
	keyLength:   32,
}

// HashPassword generates an Argon2id hash of a password and returns it in PHC string format.
func HashPassword(password string) (string, error) {
	// 1. Generate a cryptographically secure random salt
	salt := make([]byte, defaultParams.saltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate salt: %w", err)
	}

	// 2. Hash the password using Argon2id
	hash := argon2.IDKey(
		[]byte(password),
		salt,
		defaultParams.iterations,
		defaultParams.memory,
		defaultParams.parallelism,
		defaultParams.keyLength,
	)

	// 3. Base64 encode the salt and hashed password (Raw Std Encoding removes padding)
	b64Salt := base64.RawStdEncoding.EncodeToString(salt)
	b64Hash := base64.RawStdEncoding.EncodeToString(hash)

	// 4. Format into the standard PHC string representation
	// Example: $argon2id$v=19$m=65536,t=1,p=2$<salt>$<hash>
	encodedHash := fmt.Sprintf(
		"$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version,
		defaultParams.memory,
		defaultParams.iterations,
		defaultParams.parallelism,
		b64Salt,
		b64Hash,
	)

	return encodedHash, nil
}

// VerifyPassword compares a plaintext password against an encoded Argon2id hash.
func VerifyPassword(password, encodedHash string) (bool, error) {
	// 1. Split the encoded hash string into its components
	parts := strings.Split(encodedHash, "$")
	if len(parts) != 6 {
		return false, errors.New("invalid hash format")
	}

	// 2. Ensure it's an argon2id hash
	if parts[1] != "argon2id" {
		return false, errors.New("incompatible hashing algorithm")
	}

	// 3. Extract the version and verify it matches the current implementation
	var version int
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil || version != argon2.Version {
		return false, errors.New("incompatible argon2 version")
	}

	// 4. Extract the memory, iterations, and parallelism parameters used to create the hash
	var memory, iterations uint32
	var parallelism uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil {
		return false, errors.New("invalid hash parameters")
	}

	// 5. Decode the salt
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, errors.New("invalid salt encoding")
	}

	// 6. Decode the original hash
	decodedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, errors.New("invalid hash encoding")
	}
	keyLen := uint32(len(decodedHash))

	// 7. Compute a new hash of the provided password using the EXACT same parameters and salt
	comparisonHash := argon2.IDKey(
		[]byte(password),
		salt,
		iterations,
		memory,
		parallelism,
		keyLen,
	)

	// 8. Use ConstantTimeCompare to prevent timing attacks
	if subtle.ConstantTimeCompare(decodedHash, comparisonHash) == 1 {
		return true, nil
	}

	return false, nil
}
