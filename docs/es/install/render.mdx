---
read_when:
    - Implementación de OpenClaw en Render
    - Quieres una implementación declarativa en la nube con Blueprints de Render
summary: Implementa OpenClaw en Render con infraestructura como código
title: Render
x-i18n:
    generated_at: "2026-04-23T14:04:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

Implementa OpenClaw en Render con infraestructura como código. El `render.yaml` Blueprint incluido define toda tu pila de forma declarativa, servicio, disco, variables de entorno, para que puedas implementar con un solo clic y versionar tu infraestructura junto con tu código.

## Requisitos previos

- Una [cuenta de Render](https://render.com) (hay nivel gratuito disponible)
- Una clave de API de tu [proveedor de modelos](/es/providers) preferido

## Implementar con un Blueprint de Render

[Implementar en Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Al hacer clic en este enlace:

1. Se creará un nuevo servicio de Render a partir del Blueprint `render.yaml` en la raíz de este repositorio.
2. Se compilará la imagen de Docker y se implementará

Una vez implementado, la URL de tu servicio seguirá el patrón `https://<service-name>.onrender.com`.

## Comprender el Blueprint

Los Blueprints de Render son archivos YAML que definen tu infraestructura. El archivo `render.yaml` de este
repositorio configura todo lo necesario para ejecutar OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

Características principales del Blueprint utilizadas:

| Característica        | Propósito                                                    |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Compila a partir del Dockerfile del repositorio                          |
| `healthCheckPath`     | Render supervisa `/health` y reinicia instancias no saludables |
| `generateValue: true` | Genera automáticamente un valor criptográficamente seguro            |
| `disk`                | Almacenamiento persistente que sobrevive a las reimplementaciones                 |

## Elegir un plan

| Plan      | Suspensión         | Disco          | Ideal para                      |
| --------- | ----------------- | ------------- | ----------------------------- |
| Free      | Después de 15 min inactivo | No disponible | Pruebas, demostraciones                |
| Starter   | Nunca             | 1GB+          | Uso personal, equipos pequeños     |
| Standard+ | Nunca             | 1GB+          | Producción, varios canales |

El Blueprint usa `starter` de forma predeterminada. Para usar el nivel gratuito, cambia `plan: free` en
el `render.yaml` de tu fork (pero ten en cuenta que: sin disco persistente, el estado de OpenClaw
se restablece en cada implementación).

## Después de la implementación

### Acceder a la interfaz Control

El panel web está disponible en `https://<your-service>.onrender.com/`.

Conéctate usando el secreto compartido configurado. Esta plantilla de implementación genera automáticamente
`OPENCLAW_GATEWAY_TOKEN` (encuéntralo en **Dashboard → your service →
Environment**); si lo sustituyes por autenticación con contraseña, usa esa contraseña
en su lugar.

## Funciones del panel de Render

### Registros

Consulta registros en tiempo real en **Dashboard → your service → Logs**. Filtra por:

- Registros de compilación (creación de imagen Docker)
- Registros de implementación (inicio del servicio)
- Registros de tiempo de ejecución (salida de la aplicación)

### Acceso al shell

Para depuración, abre una sesión de shell mediante **Dashboard → your service → Shell**. El disco persistente está montado en `/data`.

### Variables de entorno

Modifica variables en **Dashboard → your service → Environment**. Los cambios activan una reimplementación automática.

### Implementación automática

Si usas el repositorio original de OpenClaw, Render no volverá a implementar automáticamente tu OpenClaw. Para actualizarlo, ejecuta una sincronización manual del Blueprint desde el panel.

## Dominio personalizado

1. Ve a **Dashboard → your service → Settings → Custom Domains**
2. Añade tu dominio
3. Configura el DNS según se indique (CNAME a `*.onrender.com`)
4. Render aprovisiona automáticamente un certificado TLS

## Escalado

Render admite escalado horizontal y vertical:

- **Vertical**: cambia el plan para obtener más CPU/RAM
- **Horizontal**: aumenta el número de instancias (plan Standard o superior)

Para OpenClaw, normalmente el escalado vertical es suficiente. El escalado horizontal requiere sesiones persistentes o gestión de estado externa.

## Copias de seguridad y migración

Exporta tu estado, configuración, perfiles de autenticación y espacio de trabajo en cualquier momento usando el
acceso al shell en el panel de Render:

```bash
openclaw backup create
```

Esto crea un archivo de copia de seguridad portable con el estado de OpenClaw más cualquier
espacio de trabajo configurado. Consulta [Backup](/es/cli/backup) para más detalles.

## Solución de problemas

### El servicio no se inicia

Consulta los registros de implementación en el panel de Render. Problemas habituales:

- Falta `OPENCLAW_GATEWAY_TOKEN`: verifica que esté establecido en **Dashboard → Environment**
- Incompatibilidad de puerto: asegúrate de que `OPENCLAW_GATEWAY_PORT=8080` esté establecido para que el gateway se vincule al puerto que Render espera

### Arranques en frío lentos (nivel gratuito)

Los servicios del nivel gratuito se suspenden tras 15 minutos de inactividad. La primera solicitud después de la suspensión tarda unos segundos mientras se inicia el contenedor. Actualiza al plan Starter para tener servicio siempre activo.

### Pérdida de datos tras reimplementación

Esto ocurre en el nivel gratuito (sin disco persistente). Actualiza a un plan de pago o
exporta regularmente una copia de seguridad completa con `openclaw backup create` en el shell de Render.

### Fallos de la comprobación de estado

Render espera una respuesta 200 de `/health` en un plazo de 30 segundos. Si las compilaciones tienen éxito pero las implementaciones fallan, es posible que el servicio esté tardando demasiado en iniciarse. Comprueba:

- Los registros de compilación para ver errores
- Si el contenedor se ejecuta localmente con `docker build && docker run`

## Próximos pasos

- Configura canales de mensajería: [Channels](/es/channels)
- Configura el Gateway: [Gateway configuration](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Updating](/es/install/updating)
