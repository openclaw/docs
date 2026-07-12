---
read_when:
    - Desplegar OpenClaw en Render
    - Quieres un despliegue declarativo en la nube con Render Blueprints
summary: Implementa OpenClaw en Render con infraestructura como código
title: Renderizar
x-i18n:
    generated_at: "2026-07-11T23:11:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5fbb3c6df04e186df958a62a6130da4e3e485acfeecc7e85fee0d5b69a0438f
    source_path: install/render.mdx
    workflow: 16
---

Implementa OpenClaw en [Render](https://render.com) mediante el Blueprint `render.yaml` del repositorio. Este declara el servicio, el disco y las variables de entorno en un solo archivo.

## Requisitos previos

- Una [cuenta de Render](https://render.com) (hay un nivel gratuito disponible)
- Una clave de API de tu [proveedor de modelos](/es/providers) preferido

## Implementación

[Implementar en Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

Esto crea un servicio de Render a partir de `render.yaml`, genera la imagen de Docker y la implementa. La URL de tu servicio sigue el patrón `https://<service-name>.onrender.com`.

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
        generateValue: true # genera automáticamente un token seguro
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

| Característica        | Propósito                                                           |
| --------------------- | ------------------------------------------------------------------- |
| `runtime: docker`     | Genera la imagen a partir del Dockerfile del repositorio             |
| `healthCheckPath`     | Render supervisa `/health` y reinicia las instancias con problemas   |
| `generateValue: true` | Genera automáticamente un valor criptográficamente seguro            |
| `disk`                | Almacenamiento persistente que se conserva entre implementaciones    |

## Elegir un plan

| Plan      | Suspensión                   | Disco         | Ideal para                          |
| --------- | ---------------------------- | ------------- | ---------------------------------- |
| Free      | Tras 15 min de inactividad   | No disponible | Pruebas y demostraciones           |
| Starter   | Nunca                        | 1 GB o más    | Uso personal y equipos pequeños    |
| Standard+ | Nunca                        | 1 GB o más    | Producción y múltiples canales     |

El Blueprint utiliza `starter` de forma predeterminada. Para usar el nivel gratuito, cambia `plan: free` en el archivo `render.yaml` de tu bifurcación. Ten en cuenta que, al no disponer de un disco persistente, el estado de OpenClaw se restablece con cada implementación.

## Después de la implementación

### Acceder a la interfaz de control

El panel web está disponible en `https://<your-service>.onrender.com/`. Conéctate mediante el secreto compartido: el `OPENCLAW_GATEWAY_TOKEN` generado automáticamente (puedes encontrarlo en **Dashboard → your service → Environment**), o mediante tu contraseña si cambiaste a la autenticación por contraseña.

### Registros

**Dashboard → your service → Logs** muestra los registros de compilación (creación de la imagen de Docker), los registros de implementación (inicio del servicio) y los registros de ejecución (salida de la aplicación).

### Acceso al intérprete de comandos

**Dashboard → your service → Shell** abre una sesión del intérprete de comandos. El disco persistente está montado en `/data`.

### Variables de entorno

Edita las variables en **Dashboard → your service → Environment**. Los cambios activan una nueva implementación automática.

### Implementación automática

Render vuelve a implementar el servicio automáticamente cuando se añade una confirmación nueva a la rama del repositorio conectado. Si realizaste la implementación directamente desde `openclaw/openclaw` en lugar de hacerlo desde tu propia bifurcación, no tendrás acceso de escritura para activarla. En ese caso, actualiza el servicio ejecutando una sincronización manual del Blueprint desde el Dashboard o configura el servicio para que use tu propia bifurcación.

## Dominio personalizado

1. **Dashboard → your service → Settings → Custom Domains**
2. Añade tu dominio
3. Configura el DNS según las instrucciones (CNAME a `*.onrender.com`)
4. Render aprovisiona automáticamente un certificado TLS

## Escalado

- **Vertical**: cambia el plan para disponer de más CPU y RAM. Suele ser suficiente para OpenClaw.
- **Horizontal**: aumenta el número de instancias (plan Standard o superior). Requiere sesiones persistentes o una gestión externa del estado, ya que OpenClaw conserva el estado de ejecución en el disco local.

## Copias de seguridad y migración

Desde el intérprete de comandos del Dashboard de Render, puedes exportar en cualquier momento el estado, la configuración, los perfiles de autenticación y el espacio de trabajo:

```bash
openclaw backup create
```

Esto crea un archivo de copia de seguridad portátil. Consulta [Copia de seguridad](/es/cli/backup).

## Solución de problemas

### El servicio no se inicia

Consulta los registros de implementación en el Dashboard de Render. Problemas habituales:

- Falta `OPENCLAW_GATEWAY_TOKEN`: verifica que esté configurado en **Dashboard → Environment**
- El puerto no coincide: asegúrate de establecer `OPENCLAW_GATEWAY_PORT=8080` para que el Gateway se vincule al puerto que Render espera

### Inicios en frío lentos (nivel gratuito)

Los servicios del nivel gratuito se suspenden después de 15 minutos de inactividad. La primera solicitud posterior tarda unos segundos mientras se inicia el contenedor. Cambia al plan Starter para mantener el servicio siempre activo.

### Pérdida de datos después de una nueva implementación

Ocurre en el nivel gratuito, que no dispone de disco persistente. Cambia a un plan de pago o exporta periódicamente una copia de seguridad con `openclaw backup create` desde el intérprete de comandos de Render.

### Fallos en la comprobación de estado

Si las compilaciones se completan correctamente, pero las implementaciones fallan, es posible que el servicio tarde demasiado en iniciarse o que no se pueda acceder a `/health`. Comprueba:

- Si hay errores en los registros de compilación
- Si el contenedor se ejecuta localmente con `docker build && docker run`

## Próximos pasos

- Configura canales de mensajería: [Canales](/es/channels)
- Configura el Gateway: [Configuración del Gateway](/es/gateway/configuration)
- Mantén OpenClaw actualizado: [Actualización](/es/install/updating)
