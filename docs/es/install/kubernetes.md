---
read_when:
    - Quieres ejecutar OpenClaw en un clúster de Kubernetes
    - Quieres probar OpenClaw en un entorno de Kubernetes
summary: Desplegar OpenClaw Gateway en un clúster de Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-04-24T05:35:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f45e165569332277d1108cd34a4357f03f5a1cbfa93bbbcf478717945627bad
    source_path: install/kubernetes.md
    workflow: 15
---

# OpenClaw en Kubernetes

Un punto de partida mínimo para ejecutar OpenClaw en Kubernetes; no es un despliegue listo para producción. Cubre los recursos principales y está pensado para adaptarse a tu entorno.

## ¿Por qué no Helm?

OpenClaw es un único contenedor con algunos archivos de configuración. La personalización interesante está en el contenido del agente (archivos markdown, Skills, sobrescrituras de configuración), no en el templating de infraestructura. Kustomize maneja overlays sin la sobrecarga de un chart de Helm. Si tu despliegue crece en complejidad, puedes superponer un chart de Helm sobre estos manifiestos.

## Qué necesitas

- Un clúster de Kubernetes en ejecución (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado a tu clúster
- Una clave API para al menos un proveedor de modelos

## Inicio rápido

```bash
# Reemplaza con tu proveedor: ANTHROPIC, GEMINI, OPENAI, o OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

Recupera el secreto compartido configurado para la Control UI. Este script de despliegue
crea autenticación por token de forma predeterminada:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuración local, `./scripts/k8s/deploy.sh --show-token` imprime el token después del despliegue.

## Pruebas locales con Kind

Si no tienes un clúster, crea uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta automáticamente docker o podman
./scripts/k8s/create-kind.sh --delete  # desmonta el clúster
```

Luego despliega como siempre con `./scripts/k8s/deploy.sh`.

## Paso a paso

### 1) Desplegar

**Opción A** — clave API en el entorno (un paso):

```bash
# Reemplaza con tu proveedor: ANTHROPIC, GEMINI, OPENAI, o OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

El script crea un Secret de Kubernetes con la clave API y un token de Gateway generado automáticamente, y luego despliega. Si el Secret ya existe, conserva el token actual del Gateway y cualquier clave de proveedor que no se esté cambiando.

**Opción B** — crear el Secret por separado:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Usa `--show-token` con cualquiera de los dos comandos si quieres que el token se imprima en stdout para pruebas locales.

### 2) Acceder al gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Qué se despliega

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personalización

### Instrucciones del agente

Edita `AGENTS.md` en `scripts/k8s/manifests/configmap.yaml` y vuelve a desplegar:

```bash
./scripts/k8s/deploy.sh
```

### Configuración del Gateway

Edita `openclaw.json` en `scripts/k8s/manifests/configmap.yaml`. Consulta [Configuración del Gateway](/es/gateway/configuration) para la referencia completa.

### Agregar proveedores

Vuelve a ejecutar con claves adicionales exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Las claves existentes de proveedores permanecen en el Secret salvo que las sobrescribas.

O modifica el Secret directamente:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Namespace personalizado

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagen personalizada

Edita el campo `image` en `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # o fíjala a una versión específica de https://github.com/openclaw/openclaw/releases
```

### Exponer más allá de port-forward

Los manifiestos predeterminados vinculan el Gateway a loopback dentro del pod. Eso funciona con `kubectl port-forward`, pero no funciona con un `Service` o una ruta de Ingress de Kubernetes que necesite llegar a la IP del pod.

Si quieres exponer el Gateway mediante un Ingress o balanceador de carga:

- Cambia el bind del Gateway en `scripts/k8s/manifests/configmap.yaml` de `loopback` a un bind fuera de loopback que coincida con tu modelo de despliegue
- Mantén habilitada la autenticación del Gateway y usa un punto de entrada con terminación TLS adecuado
- Configura la Control UI para acceso remoto usando el modelo de seguridad web compatible (por ejemplo HTTPS/Tailscale Serve y orígenes permitidos explícitos cuando sea necesario)

## Volver a desplegar

```bash
./scripts/k8s/deploy.sh
```

Esto aplica todos los manifiestos y reinicia el pod para recoger cualquier cambio de configuración o de Secret.

## Desmontaje

```bash
./scripts/k8s/deploy.sh --delete
```

Esto elimina el namespace y todos los recursos que contiene, incluido el PVC.

## Notas de arquitectura

- El gateway se vincula por defecto a loopback dentro del pod, por lo que la configuración incluida es para `kubectl port-forward`
- No hay recursos con alcance de clúster: todo vive en un único namespace
- Seguridad: `readOnlyRootFilesystem`, capacidades `drop: ALL`, usuario no root (UID 1000)
- La configuración predeterminada mantiene la Control UI en la ruta más segura de acceso local: bind en loopback más `kubectl port-forward` a `http://127.0.0.1:18789`
- Si vas más allá del acceso desde localhost, usa el modelo remoto compatible: HTTPS/Tailscale más el bind apropiado del Gateway y la configuración de origen de la Control UI
- Los Secrets se generan en un directorio temporal y se aplican directamente al clúster; no se escribe material secreto en el checkout del repositorio

## Estructura de archivos

```
scripts/k8s/
├── deploy.sh                   # Crea namespace + secret, despliega vía kustomize
├── create-kind.sh              # Clúster Kind local (detecta automáticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base de Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Especificación del pod con endurecimiento de seguridad
    ├── pvc.yaml                # 10Gi de almacenamiento persistente
    └── service.yaml            # ClusterIP en 18789
```

## Relacionado

- [Docker](/es/install/docker)
- [Docker VM runtime](/es/install/docker-vm-runtime)
- [Resumen de instalación](/es/install)
