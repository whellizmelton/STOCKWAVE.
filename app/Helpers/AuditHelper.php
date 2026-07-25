<?php

namespace App\Helpers;

use App\Core\Database;
use PDO;

class AuditHelper
{
    public static function log(
        int $empresaId,
        ?int $usuarioId,
        string $action,
        string $tableName,
        ?int $recordId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): bool {
        $sql = 'INSERT INTO audit_logs (
                    empresa_id, usuario_id, action, table_name, record_id,
                    old_values, new_values, ip_address, user_agent
                ) VALUES (
                    :empresa_id, :usuario_id, :action, :table_name, :record_id,
                    :old_values, :new_values, :ip_address, :user_agent
                )';

        $stmt = Database::getInstance()->getConnection()->prepare($sql);

        return $stmt->execute([
            ':empresa_id' => $empresaId,
            ':usuario_id' => $usuarioId,
            ':action' => $action,
            ':table_name' => $tableName,
            ':record_id' => $recordId,
            ':old_values' => $oldValues ? json_encode($oldValues, JSON_UNESCAPED_UNICODE) : null,
            ':new_values' => $newValues ? json_encode($newValues, JSON_UNESCAPED_UNICODE) : null,
            ':ip_address' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        ]);
    }
}
