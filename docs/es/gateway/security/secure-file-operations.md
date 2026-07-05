---
read_when:
    - Cambiar el acceso a archivos, la extracción de archivos comprimidos, el almacenamiento del espacio de trabajo o los ayudantes del sistema de archivos de Plugin
summary: Cómo OpenClaw gestiona de forma segura el acceso a archivos locales y por qué el asistente opcional de Python fs-safe está desactivado de forma predeterminada
title: Operaciones seguras con archivos
x-i18n:
    generated_at: "2026-07-05T11:21:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operaciones locales de archivos sensibles para la seguridad: lecturas/escrituras limitadas a una raíz, reemplazo atómico, extracción de archivos comprimidos, espacios de trabajo temporales, estado JSON y manejo de archivos de secretos.

Es una **barrera de biblioteca** para código confiable de OpenClaw que recibe nombres de ruta no confiables, no un sandbox. Los permisos del sistema de archivos del host, los usuarios del SO, los contenedores y la política del agente/herramienta siguen definiendo el radio de impacto real.

## Predeterminado: sin ayudante de Python

OpenClaw establece el ayudante POSIX de Python de fs-safe en **desactivado** de forma predeterminada:

- el Gateway no debe iniciar un sidecar persistente de Python a menos que un operador lo habilite explícitamente;
- la mayoría de las instalaciones no necesitan el endurecimiento adicional contra mutaciones del directorio padre;
- desactivar Python mantiene el comportamiento en tiempo de ejecución predecible en entornos de escritorio, Docker, CI y aplicaciones empaquetadas.

OpenClaw solo cambia el _valor predeterminado_. Una configuración explícita siempre tiene prioridad:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter path.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Los nombres de entorno genéricos de fs-safe también funcionan: `FS_SAFE_PYTHON_MODE` y `FS_SAFE_PYTHON`.

Usa `require` (no `auto`) cuando el ayudante forme parte de tu postura de seguridad; `auto` vuelve silenciosamente al comportamiento solo con Node si el ayudante no puede iniciarse.

## Qué sigue protegido sin Python

Con el ayudante desactivado, OpenClaw sigue obteniendo las barreras solo con Node de fs-safe:

- rechaza escapes de rutas relativas (`..`), rutas absolutas y separadores de ruta donde solo se permiten nombres simples;
- resuelve operaciones mediante un manejador de raíz confiable en lugar de comprobaciones ad hoc con `path.resolve(...).startsWith(...)`;
- rechaza patrones de enlaces simbólicos y enlaces duros en las API que requieren esa política;
- abre archivos con comprobaciones de identidad donde la API devuelve o consume contenido de archivo;
- escribe archivos de estado/configuración mediante un temporal hermano atómico + cambio de nombre;
- aplica límites de bytes para lecturas y extracción de archivos comprimidos;
- aplica modos de archivo privados para secretos y archivos de estado donde la API los requiere.

Esto cubre el modelo de amenazas normal de OpenClaw: código confiable del Gateway que maneja entradas de rutas no confiables de modelo/Plugin/canal dentro de un único límite de operador confiable.

## Qué agrega Python

En POSIX, el ayudante opcional mantiene un proceso persistente de Python y usa operaciones del sistema de archivos relativas a fd para mutaciones del directorio padre: cambio de nombre, eliminación, mkdir, stat/list y algunas rutas de escritura.

Eso reduce las ventanas de carrera con el mismo UID donde otro proceso intercambia un directorio padre entre la validación y la mutación: defensa en profundidad en hosts donde procesos locales no confiables pueden modificar los mismos directorios en los que opera OpenClaw.

Si tu despliegue tiene ese riesgo y Python tiene garantizada su disponibilidad, establece:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Guía para Plugin y núcleo

- El acceso a archivos orientado a Plugins debe pasar por los ayudantes de `openclaw/plugin-sdk/*`, no por `fs` sin procesar, cuando una ruta proviene de un mensaje, salida de modelo, configuración o entrada de Plugin.
- El código del núcleo debe usar los envoltorios de fs-safe bajo `src/infra/*` para que la política de proceso de OpenClaw se aplique de forma coherente.
- La extracción de archivos comprimidos debe usar los ayudantes de archivo comprimido de fs-safe con límites explícitos de tamaño, cantidad de entradas, enlaces y destino.
- Los secretos deben usar los ayudantes de secretos de OpenClaw o los ayudantes de secretos/estado privado de fs-safe; no implementes manualmente comprobaciones de modo alrededor de `fs.writeFile`.
- Para aislamiento frente a usuarios locales hostiles, no dependas solo de fs-safe. Ejecuta Gateways separados bajo usuarios/hosts de SO separados, o usa sandboxing.

Relacionado: [Seguridad](/es/gateway/security), [Sandboxing](/es/gateway/sandboxing), [Aprobaciones de exec](/es/tools/exec-approvals), [Secretos](/es/gateway/secrets).
