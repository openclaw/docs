---
read_when:
    - Cambiar el acceso a archivos, la extracción de archivos comprimidos, el almacenamiento del espacio de trabajo o las funciones auxiliares del sistema de archivos de Plugin
summary: Cómo OpenClaw gestiona de forma segura el acceso a archivos locales y por qué la herramienta auxiliar opcional fs-safe de Python está desactivada por defecto
title: Operaciones seguras con archivos
x-i18n:
    generated_at: "2026-05-06T05:36:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operaciones locales de archivos sensibles a la seguridad: lecturas/escrituras acotadas a una raíz, reemplazo atómico, extracción de archivos comprimidos, espacios de trabajo temporales, estado JSON y manejo de archivos secretos.

El objetivo es una **barandilla de biblioteca** coherente para código confiable de OpenClaw que recibe nombres de rutas no confiables. No es un sandbox. Los permisos del sistema de archivos del host, los usuarios del sistema operativo, los contenedores y la política de agente/herramienta siguen definiendo el radio de impacto real.

## Predeterminado: sin ayudante de Python

OpenClaw configura de forma predeterminada el ayudante de Python POSIX de fs-safe en **desactivado**.

Por qué:

- el gateway no debería iniciar un sidecar persistente de Python a menos que un operador lo haya habilitado;
- muchas instalaciones no necesitan el refuerzo adicional contra mutaciones de directorios padre;
- deshabilitar Python mantiene el comportamiento del paquete/runtime más predecible entre entornos de escritorio, Docker, CI y aplicaciones empaquetadas.

OpenClaw solo cambia el valor predeterminado. Si estableces explícitamente un modo, fs-safe lo respeta:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Los nombres genéricos de fs-safe también funcionan: `FS_SAFE_PYTHON_MODE` y `FS_SAFE_PYTHON`.

## Qué permanece protegido sin Python

Con el ayudante desactivado, OpenClaw sigue usando las rutas de Node de fs-safe para:

- rechazar escapes de rutas relativas como `..`, rutas absolutas y separadores de ruta donde solo se permiten nombres;
- resolver operaciones mediante un manejador de raíz confiable en lugar de comprobaciones ad hoc de `path.resolve(...).startsWith(...)`;
- rechazar patrones de enlaces simbólicos y enlaces duros en APIs que requieren esa política;
- abrir archivos con comprobaciones de identidad cuando la API devuelve o consume contenido de archivos;
- escrituras atómicas con temporales hermanos para archivos de estado/configuración;
- límites de bytes para lecturas y extracción de archivos comprimidos;
- modos privados para secretos y archivos de estado donde la API los requiere.

Estas protecciones cubren el modelo de amenazas normal de OpenClaw: código confiable del gateway que maneja entradas de ruta no confiables de modelo/plugin/canal dentro de un único límite de operador confiable.

## Qué añade Python

En POSIX, el ayudante opcional de fs-safe mantiene un proceso persistente de Python y usa operaciones del sistema de archivos relativas a descriptores de archivo para mutaciones de directorios padre, como renombrar, eliminar, crear directorios, obtener estado/listar y algunas rutas de escritura.

Esto reduce las ventanas de carrera del mismo UID en las que otro proceso puede intercambiar un directorio padre entre la validación y la mutación. Es defensa en profundidad para hosts donde procesos locales no confiables pueden modificar los mismos directorios en los que opera OpenClaw.

Si tu despliegue tiene ese riesgo y se garantiza que Python existe, usa:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Usa `require` en lugar de `auto` cuando el ayudante forme parte de tu postura de seguridad; `auto` vuelve intencionalmente al comportamiento solo de Node si el ayudante no está disponible.

## Guía para Plugin y el núcleo

- El acceso a archivos orientado a plugins debería pasar por ayudantes de `openclaw/plugin-sdk/*`, no por `fs` sin procesar, cuando una ruta proviene de un mensaje, salida de modelo, configuración o entrada de plugin.
- El código del núcleo debería usar los wrappers locales de fs-safe en `src/infra/*` para que la política de proceso de OpenClaw se aplique de forma coherente.
- La extracción de archivos comprimidos debería usar los ayudantes de archivo comprimido de fs-safe con límites explícitos de tamaño, número de entradas, enlaces y destino.
- Los secretos deberían usar ayudantes de secretos de OpenClaw o ayudantes de secretos/estado privado de fs-safe; no implementes manualmente comprobaciones de modo alrededor de `fs.writeFile`.
- Si necesitas aislamiento frente a usuarios locales hostiles, no dependas solo de fs-safe. Ejecuta gateways separados bajo usuarios/hosts de sistema operativo separados o usa sandboxing.

Relacionado: [Seguridad](/es/gateway/security), [Sandboxing](/es/gateway/sandboxing), [Aprobaciones de exec](/es/tools/exec-approvals), [Secretos](/es/gateway/secrets).
