---
read_when:
    - Quiere mantener las claves de API fuera de openclaw.json y dentro de 1Password
    - Ejecuta el Gateway sin interfaz gráfica y necesita autenticación de cuenta de servicio para op
    - Quiere que los agentes lean o inyecten secretos con la CLI de op
summary: Resuelve los secretos del Gateway con la CLI de 1Password y permite que los agentes usen la skill 1password incluida
title: 1Password
x-i18n:
    generated_at: "2026-07-14T13:39:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: dbe92009cd4409ae8e7235f5462f059783d5ca863557f1a7b12cacd47ee718c9
    source_path: gateway/1password.md
    workflow: 16
---

OpenClaw se integra con **1Password** de dos formas independientes:

- **Secretos de configuración:** cualquier campo [SecretRef](/es/gateway/secrets) de `openclaw.json` puede resolverse mediante la CLI `op` en tiempo de ejecución, por lo que las claves de API nunca se almacenan en el archivo de configuración.
- **Flujos de trabajo de agentes:** la skill `1password` incluida enseña a los agentes a iniciar sesión y leer o inyectar secretos con `op` para sus propias tareas.

## Requisitos

- La [CLI de 1Password](https://developer.1password.com/docs/cli/get-started/) (`op`) instalada en el host del Gateway (`brew install 1password-cli` en macOS).
- Un modo de autenticación para `op`:
  - **Cuenta de servicio** (recomendada para Gateways sin interfaz gráfica): exporte `OP_SERVICE_ACCOUNT_TOKEN` en el entorno del servicio del Gateway. No requiere aplicación de escritorio ni inicio de sesión interactivo.
  - **Integración con la aplicación de escritorio**: la aplicación 1Password se ejecuta en el mismo equipo con la integración de la CLI habilitada. Las primeras llamadas pueden activar Touch ID o la autenticación del sistema.
  - **Inicio de sesión independiente**: `op signin` solicita autenticación en cada sesión. Es viable para los agentes mediante la skill, pero no resulta adecuado para resolver secretos de configuración en un Gateway sin interfaz gráfica.

## Resolver secretos de configuración con op

Declare un proveedor de secretos exec que ejecute `op read` con una referencia `op://vault/item/field` y, a continuación, dirija hacia él cualquier campo compatible con SecretRef:

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // obligatorio para binarios de Homebrew enlazados simbólicamente
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

Cómo encajan las piezas:

- `command` debe ser una ruta absoluta; `trustedDirs` marca su directorio como de confianza y `allowSymlinkCommand` es necesario porque Homebrew instala `op` como enlace simbólico.
- `args` transmite literalmente la referencia `op://vault/item/field`. OpenClaw no analiza por sí mismo el esquema `op://`; el binario `op` lo resuelve.
- `passEnv` reenvía las variables indicadas desde el entorno del Gateway. La integración con la aplicación de escritorio necesita `HOME`; las cuentas de servicio también necesitan que `OP_SERVICE_ACCOUNT_TOKEN` esté presente en el entorno del servicio del Gateway (añádalo a `passEnv` o establézcalo mediante `env` solo si acepta que el token pueda leerse en el archivo de configuración).
- Para una salida de un solo valor, mantenga `id: "value"`. Con `jsonOnly: true` y una carga útil JSON, use en su lugar un id de puntero JSON para acceder a los campos.
- Una entrada de proveedor por secreto permite auditar las referencias; asigne a los proveedores nombres basados en sus consumidores (`onepassword_openai`, `onepassword_telegram`).

Consulte [Secretos del Gateway](/es/gateway/secrets) para conocer el orden de resolución, el almacenamiento en caché y la semántica de los fallos, y [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface) para ver todos los campos que aceptan SecretRefs.

## Configuración de una cuenta de servicio para Gateways sin interfaz gráfica

1. Cree una cuenta de servicio en su cuenta de 1Password y concédale acceso de lectura únicamente a los elementos de la bóveda que necesita el Gateway.
2. Proporcione `OP_SERVICE_ACCOUNT_TOKEN` al servicio del Gateway (plist de launchd, unidad de systemd o entorno del contenedor).
3. Añada `"OP_SERVICE_ACCOUNT_TOKEN"` a la lista `passEnv` del proveedor.
4. Verifique desde el entorno del host del Gateway: `op whoami` debe mostrar la cuenta de servicio sin solicitar autenticación.

Las lecturas de cuentas de servicio requieren que la bóveda se indique explícitamente en la referencia `op://`. Limite estrictamente el alcance de la cuenta; se trata de una credencial de portador.

## La skill 1password para agentes

OpenClaw incluye una skill `1password` que convierte a los agentes en operadores competentes de `op`: detecta el modo de autenticación disponible (cuenta de servicio, integración con la aplicación de escritorio o inicio de sesión independiente), verifica el acceso con `op whoami` antes de leer nada y prefiere `op run` / `op inject` en lugar de escribir valores secretos en el disco. La skill requiere el binario `op` y ofrece instalarlo mediante Homebrew cuando no está disponible.

Los agentes la utilizan para sus propios flujos de trabajo, por ejemplo, para leer un token de despliegue durante una tarea o inyectar variables de entorno en un comando. Es independiente de la resolución de secretos de configuración; el Gateway resuelve las SecretRefs sin que intervenga ninguna skill.

## Notas de seguridad

- Los valores secretos resueltos mediante proveedores exec permanecen en la memoria del Gateway; las instantáneas de configuración y las respuestas de `config.get` ocultan los campos SecretRef.
- Nunca coloque valores secretos en `openclaw.json`, registros ni chats. Mantenga los nombres de los elementos en la configuración y los valores en 1Password.
- El registro de auditoría de 1Password muestra cada lectura de las cuentas de servicio, lo que facilita la rotación de claves y la revisión de incidentes.

## Solución de problemas

- `command not found` o errores al iniciar el proceso: use la ruta absoluta de `op` e incluya su directorio en `trustedDirs`.
- `op` se resuelve, pero las lecturas fallan con errores de enlaces simbólicos: establezca `allowSymlinkCommand: true` para las instalaciones de Homebrew.
- `account is not signed in`: para las cuentas de servicio, confirme que `OP_SERVICE_ACCOUNT_TOKEN` llegue al servicio del Gateway y figure en `passEnv`; para la integración de escritorio, confirme que la aplicación esté en ejecución y desbloqueada.
- Primeras lecturas lentas: aumente `timeoutMs` en el proveedor; los arranques en frío de `op` pueden superar los tiempos de espera estrictos en hosts con mucha carga.
