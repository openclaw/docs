---
read_when:
    - Implementar OpenClaw en Render
    - Quieres un despliegue declarativo en la nube con Render Blueprints
summary: Implementa OpenClaw en Render con infraestructura como código
title: Render
x-i18n:
    generated_at: "2026-07-05T11:25:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Implementa OpenClaw en [Render](https://render.com) usando el Blueprint `render.yaml` del repositorio. Declara el servicio, el disco y las variables de entorno en un solo archivo.

## Requisitos previos

- Una [cuenta de Render](https://render.com) (nivel gratuito disponible)
- Una clave de API de tu [proveedor de modelos](/es/providers) preferido

## Implementar

[Implementar en Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Esto crea un servicio de Render desde `render.yaml`, compila la imagen de Docker y la implementa. La URL de tu servicio sigue el patrón `https://<service-name>.onrender.com`.

## El Blueprint

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

| Funcionalidad         | Propósito                                                  |
| --------------------- | ---------------------------------------------------------- |
| `runtime: docker`     | Compila desde el Dockerfile del repositorio                |
| `healthCheckPath`     | Render supervisa `/health` y reinicia instancias no sanas  |
| `generateValue: true` | Genera automáticamente un valor criptográficamente seguro  |
| `disk`                | Almacenamiento persistente que sobrevive a redeploys       |

## Elegir un plan

| Plan      | Suspensión          | Disco         | Ideal para                    |
| --------- | ------------------- | ------------- | ----------------------------- |
| Gratuito  | Tras 15 min inactivo | No disponible | Pruebas, demos                |
| Starter   | Nunca               | 1GB+          | Uso personal, equipos pequeños |
| Standard+ | Nunca               | 1GB+          | Producción, múltiples canales |

El Blueprint usa `starter` de forma predeterminada. Para usar el nivel gratuito, cambia `plan: free` en el `render.yaml` de tu fork; ten en cuenta que, sin disco persistente, el estado de OpenClaw se restablece en cada implementación.

## Después de la implementación

### Acceder a la interfaz de control

El panel web está disponible en `https://<your-service>.onrender.com/`. Conéctate usando el secreto compartido: el `OPENCLAW_GATEWAY_TOKEN` generado automáticamente (búscalo en **Dashboard → tu servicio → Environment**), o tu contraseña si cambiaste a autenticación con contraseña.

### Registros

**Dashboard → tu servicio → Logs** muestra los registros de compilación (creación de la imagen de Docker), los registros de implementación (inicio del servicio) y los registros en tiempo de ejecución (salida de la aplicación).

### Acceso al shell

**Dashboard → tu servicio → Shell** abre una sesión de shell. El disco persistente está montado en `/data`.

### Variables de entorno

Edita las variables en **Dashboard → tu servicio → Environment**. Los cambios activan una redeploy automático.

### Autoimplementación

Render redeploys automáticamente cuando la rama del repositorio conectado recibe un nuevo commit. Si implementaste directamente desde `openclaw/openclaw` en lugar de desde tu propio fork, no tienes acceso de escritura para activar eso, así que actualiza ejecutando una sincronización manual del Blueprint desde el Dashboard, o apunta el servicio a tu propio fork.

## Dominio personalizado

1. **Dashboard → tu servicio → Settings → Custom Domains**
2. Añade tu dominio
3. Configura el DNS según las instrucciones (CNAME a `*.onrender.com`)
4. Render aprovisiona automáticamente un certificado TLS

## Escalado

- **Vertical**: cambia el plan para obtener más CPU/RAM. Normalmente es suficiente para OpenClaw.
- **Horizontal**: aumenta el número de instancias (plan Standard y superiores). Requiere sesiones persistentes o gestión de estado externa, ya que OpenClaw mantiene el estado en tiempo de ejecución en el disco local.

## Copias de seguridad y migración

Desde el shell del Dashboard de Render, exporta el estado, la configuración, los perfiles de autenticación y el espacio de trabajo en cualquier momento:

```bash
openclaw backup create
```

Esto crea un archivo de copia de seguridad portátil. Consulta [Copia de seguridad](/es/cli/backup).

## Solución de problemas

### El servicio no se inicia

Consulta los registros de implementación en el Dashboard de Render. Problemas comunes:

- Falta `OPENCLAW_GATEWAY_TOKEN`; verifica que esté configurado en **Dashboard → Environment**
- Discordancia de puerto; asegúrate de que `OPENCLAW_GATEWAY_PORT=8080` para que el gateway se vincule al puerto que Render espera

### Inicios en frío lentos (nivel gratuito)

Los servicios del nivel gratuito se suspenden tras 15 minutos de inactividad; la primera solicitud después de la suspensión tarda unos segundos mientras se inicia el contenedor. Sube a Starter para funcionamiento siempre activo.

### Pérdida de datos después de redeploy

Ocurre en el nivel gratuito (sin disco persistente). Sube a un plan de pago o exporta regularmente una copia de seguridad con `openclaw backup create` desde el shell de Render.

### Fallos de comprobación de estado

Si las compilaciones se completan correctamente pero las implementaciones fallan, el servicio puede estar tardando demasiado en iniciarse o `/health` puede no estar accesible. Comprueba:

- Los registros de compilación para ver errores
- Si el contenedor se ejecuta localmente con `docker build && docker run`

## Siguientes pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualizar](/es/install/updating)
