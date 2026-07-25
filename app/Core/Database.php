<?php

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

class Database
{
    private static ?self $instance = null;
    private PDO $connection;
    private ?int $tenantId = null;

    private function __construct()
    {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->connection = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            throw new RuntimeException('Database connection failed');
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    public function setTenantContext(int $tenantId): void
    {
        if ($tenantId <= 0) {
            throw new RuntimeException('Tenant ID must be positive');
        }

        $stmt = $this->connection->prepare(
            "SELECT id FROM empresas WHERE id = :id AND status = 'active'"
        );
        $stmt->execute([':id' => $tenantId]);

        if (!$stmt->fetch()) {
            throw new RuntimeException('Tenant not found or inactive');
        }

        $this->tenantId = $tenantId;
    }

    public function getTenantId(): int
    {
        if ($this->tenantId === null) {
            throw new RuntimeException('No tenant context set');
        }

        return $this->tenantId;
    }

    public function getTenantContext(): int
    {
        return $this->tenantId ?? 1; // Fallback para empresa 1
    }

    public function lastInsertId(): string
    {
        return $this->connection->lastInsertId();
    }

    public function beginTransaction(): void
    {
        $this->connection->beginTransaction();
    }

    public function commit(): void
    {
        $this->connection->commit();
    }

    public function rollBack(): void
    {
        if ($this->connection->inTransaction()) {
            $this->connection->rollBack();
        }
    }
}
