---
read_when:
    - Quieres ejecutar OpenClaw en un clúster de Kubernetes
    - Quieres probar OpenClaw en un entorno Kubernetes
summary: Implementa OpenClaw Gateway en un clúster de Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-05T11:24:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Un punto de partida mínimo para ejecutar OpenClaw en Kubernetes, no un despliegue listo para producción. Cubre los recursos principales y está pensado para adaptarse a tu entorno.

## Por qué no Helm

OpenClaw es un único contenedor con algunos archivos de configuración. La personalización interesante está en el contenido del agente (archivos Markdown, skills, sobrescrituras de configuración), no en las plantillas de infraestructura. Kustomize gestiona superposiciones sin la sobrecarga de un chart de Helm. Añade un chart de Helm encima de estos manifiestos si tu despliegue se vuelve más complejo.

## Qué necesitas

- Un clúster de Kubernetes en ejecución (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado a tu clúster
- Una clave de API para al menos un proveedor de modelos

## Inicio rápido

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` crea autenticación por token de forma predeterminada. Recupera el token generado del Gateway para la Control UI:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuración local, `./scripts/k8s/deploy.sh --show-token` imprime el token después del despliegue.

## Pruebas locales con Kind

Si no tienes un clúster, crea uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Luego despliega como de costumbre con `./scripts/k8s/deploy.sh`.

## Paso a paso

### 1) Desplegar

**Opción A: clave de API en el entorno (un paso)**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

El script crea un Secret de Kubernetes con la clave de API y un token de Gateway generado automáticamente, y luego despliega. Si el Secret ya existe, conserva el token de Gateway actual y cualquier clave de proveedor que no se esté cambiando.

**Opción B: crear el secreto por separado**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Añade `--show-token` a cualquiera de los comandos para imprimir el token en stdout para pruebas locales.

### 2) Acceder al Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Qué se despliega

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## Personalización

### Instrucciones del agente

Edita el `AGENTS.md` en `scripts/k8s/manifests/configmap.yaml` y vuelve a desplegar:

```bash
./scripts/k8s/deploy.sh
```

### Configuración del Gateway

Edita `openclaw.json` en `scripts/k8s/manifests/configmap.yaml`. Consulta [Configuración del Gateway](/es/gateway/configuration) para ver la referencia completa.

### Añadir proveedores

Vuelve a ejecutar con claves adicionales exportadas:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Las claves de proveedor existentes permanecen en el Secret a menos que las sobrescribas.

O aplica un parche al Secret directamente:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### Espacio de nombres personalizado

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagen personalizada

Edita el campo `image` en `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### Exponer más allá de port-forward

Los manifiestos predeterminados enlazan el Gateway a loopback dentro del pod. Eso funciona con `kubectl port-forward`, pero no con un `Service` de Kubernetes o una ruta de Ingress que necesite llegar directamente a la IP del pod.

Para exponer el Gateway mediante un Ingress o un balanceador de carga:

- Cambia el enlace del Gateway en `scripts/k8s/manifests/configmap.yaml` de `loopback` a un enlace que no sea loopback y que coincida con tu modelo de despliegue.
- Mantén habilitada la autenticación del Gateway y usa un punto de entrada adecuado con terminación TLS.
- Configura la Control UI para acceso remoto usando el modelo de seguridad web admitido (por ejemplo, HTTPS/Tailscale Serve y orígenes permitidos explícitos cuando sea necesario).

## Volver a desplegar

```bash
./scripts/k8s/deploy.sh
```

Esto aplica todos los manifiestos y reinicia el pod para recoger cualquier cambio de configuración o secreto.

## Desmontaje

```bash
./scripts/k8s/deploy.sh --delete
```

Esto elimina el espacio de nombres y todos sus recursos, incluido el PVC.

## Notas de arquitectura

- El Gateway se enlaza a loopback dentro del pod de forma predeterminada, por lo que la configuración incluida es para `kubectl port-forward`.
- No hay recursos con ámbito de clúster; todo vive en un único espacio de nombres.
- Refuerzo de seguridad: `readOnlyRootFilesystem`, capacidades `drop: ALL`, usuario no root (UID 1000).
- La configuración predeterminada mantiene la Control UI en la ruta de acceso local más segura: enlace loopback más `kubectl port-forward` a `http://127.0.0.1:18789`.
- Si vas más allá del acceso localhost, usa el modelo remoto admitido: HTTPS/Tailscale más el enlace de Gateway adecuado y la configuración de orígenes de la Control UI.
- Los secretos se generan en un directorio temporal y se aplican directamente al clúster; no se escribe material secreto en el checkout del repositorio.

## Estructura de archivos

```text
scripts/k8s/
├── deploy.sh                   # Creates namespace + secret, deploys via kustomize
├── create-kind.sh              # Local Kind cluster (auto-detects docker/podman)
└── manifests/
    ├── kustomization.yaml      # Kustomize base
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Pod spec with security hardening
    ├── pvc.yaml                # 10Gi persistent storage
    └── service.yaml            # ClusterIP on 18789
```

## Relacionado

- [Docker](/es/install/docker)
- [Docker VM runtime](/es/install/docker-vm-runtime)
- [Resumen de instalación](/es/install)
