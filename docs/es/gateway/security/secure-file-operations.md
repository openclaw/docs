---
read_when:
    - Cambiar el acceso a archivos, la extracción de archivos comprimidos, el almacenamiento del espacio de trabajo o los auxiliares del sistema de archivos de plugins
summary: Cómo gestiona OpenClaw de forma segura el acceso a archivos locales y por qué el asistente opcional de Python fs-safe está desactivado de forma predeterminada
title: Operaciones seguras con archivos
x-i18n:
    generated_at: "2026-07-11T23:08:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) para operaciones sensibles a la seguridad con archivos locales: lecturas y escrituras limitadas a una raíz, reemplazo atómico, extracción de archivos, espacios de trabajo temporales, estado JSON y gestión de archivos de secretos.

Es una **protección a nivel de biblioteca** para código de confianza de OpenClaw que recibe nombres de rutas que no son de confianza, no un entorno aislado. Los permisos del sistema de archivos del host, los usuarios del sistema operativo, los contenedores y la política del agente y las herramientas siguen definiendo el alcance real del impacto.

## Valor predeterminado: sin auxiliar de Python

OpenClaw establece el auxiliar POSIX de Python de fs-safe como **desactivado** de forma predeterminada:

- el Gateway no debe iniciar un proceso auxiliar persistente de Python a menos que un operador lo habilite;
- la mayoría de las instalaciones no necesitan la protección adicional contra modificaciones de directorios superiores;
- desactivar Python mantiene un comportamiento de ejecución predecible en entornos de escritorio, Docker, CI y aplicaciones empaquetadas.

OpenClaw solo cambia el valor _predeterminado_. Una configuración explícita siempre prevalece:

```bash
# Comportamiento predeterminado de OpenClaw: alternativas de fs-safe solo con Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Habilita el auxiliar cuando esté disponible y recurre a la alternativa si no lo está.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Falla de forma segura si el auxiliar no puede iniciarse.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Ruta explícita opcional al intérprete.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Los nombres genéricos de variables de entorno de fs-safe también funcionan: `FS_SAFE_PYTHON_MODE` y `FS_SAFE_PYTHON`.

Usa `require` (no `auto`) cuando el auxiliar forme parte de tu estrategia de seguridad; `auto` recurre silenciosamente al comportamiento exclusivo de Node si el auxiliar no puede iniciarse.

## Qué permanece protegido sin Python

Con el auxiliar desactivado, OpenClaw sigue contando con las protecciones exclusivas de Node de fs-safe:

- rechaza escapes de rutas relativas (`..`), rutas absolutas y separadores de rutas cuando solo se permiten nombres simples;
- resuelve las operaciones mediante un descriptor de raíz de confianza en lugar de comprobaciones improvisadas con `path.resolve(...).startsWith(...)`;
- rechaza patrones de enlaces simbólicos y enlaces físicos en las API que exigen esa política;
- abre archivos con comprobaciones de identidad cuando la API devuelve o consume su contenido;
- escribe archivos de estado y configuración mediante un archivo temporal hermano y un cambio de nombre atómico;
- aplica límites de bytes a las lecturas y a la extracción de archivos;
- aplica modos de archivo privados a los secretos y archivos de estado cuando la API lo exige.

Esto cubre el modelo de amenazas habitual de OpenClaw: código de confianza del Gateway que gestiona entradas de rutas no confiables procedentes de modelos, plugins o canales dentro de un único límite de confianza del operador.

## Qué aporta Python

En POSIX, el auxiliar opcional mantiene un único proceso persistente de Python y usa operaciones del sistema de archivos relativas a descriptores de archivo para las modificaciones de directorios superiores: cambiar nombres, eliminar, crear directorios, consultar metadatos/listar y algunas rutas de escritura.

Esto reduce las ventanas de condiciones de carrera con el mismo UID en las que otro proceso sustituye un directorio superior entre la validación y la modificación; es una defensa en profundidad para hosts donde procesos locales que no son de confianza pueden modificar los mismos directorios en los que opera OpenClaw.

Si tu implementación presenta ese riesgo y se garantiza la disponibilidad de Python, configura:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Orientación para plugins y el núcleo

- El acceso a archivos desde plugins debe realizarse mediante los auxiliares de `openclaw/plugin-sdk/*`, no directamente mediante `fs`, cuando una ruta procede de un mensaje, la salida de un modelo, una configuración o la entrada de un plugin.
- El código del núcleo debe usar los envoltorios de fs-safe incluidos en `src/infra/*` para que la política de procesos de OpenClaw se aplique de forma coherente.
- La extracción de archivos debe usar los auxiliares de extracción de fs-safe con límites explícitos de tamaño, número de entradas, enlaces y destino.
- Los secretos deben usar los auxiliares de secretos de OpenClaw o los auxiliares de secretos y estado privado de fs-safe; no implementes manualmente comprobaciones de modos en torno a `fs.writeFile`.
- Para aislarse de usuarios locales hostiles, no dependas únicamente de fs-safe. Ejecuta gateways separados bajo usuarios o hosts distintos del sistema operativo, o usa un entorno aislado.

Relacionado: [Seguridad](/es/gateway/security), [Aislamiento](/es/gateway/sandboxing), [Aprobaciones de ejecución](/es/tools/exec-approvals), [Secretos](/es/gateway/secrets).
