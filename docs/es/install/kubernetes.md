---
read_when:
    - Desea ejecutar OpenClaw en un clúster de Kubernetes
    - Desea probar OpenClaw en un entorno de Kubernetes
summary: Despliega OpenClaw Gateway en un clúster de Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T05:39:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
---

Un punto de partida mínimo para ejecutar OpenClaw en Kubernetes — no una implementación lista para producción. Cubre los recursos principales y está pensado para adaptarse a tu entorno.

## ¿Por qué no Helm?

OpenClaw es un solo contenedor con algunos archivos de configuración. La personalización interesante está en el contenido del agente (archivos markdown, skills, sobrescrituras de configuración), no en la generación de plantillas de infraestructura. Kustomize gestiona overlays sin la sobrecarga de un chart de Helm. Si tu implementación se vuelve más compleja, se puede superponer un chart de Helm sobre estos manifiestos.

## Lo que necesitas

- Un clúster Kubernetes en ejecución (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
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

Recupera el secreto compartido configurado para la interfaz de control. Este script de implementación
crea autenticación con token de forma predeterminada:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para depuración local, `./scripts/k8s/deploy.sh --show-token` imprime el token después de la implementación.

## Pruebas locales con Kind

Si no tienes un clúster, crea uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

Luego implementa como de costumbre con `./scripts/k8s/deploy.sh`.

## Paso a paso

### 1) Implementar

**Opción A** — clave de API en el entorno (un paso):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

El script crea un Secret de Kubernetes con la clave de API y un token de gateway generado automáticamente, y luego implementa. Si el Secret ya existe, conserva el token de gateway actual y las claves de proveedor que no se estén cambiando.

**Opción B** — crear el secreto por separado:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Usa `--show-token` con cualquiera de los comandos si quieres que el token se imprima en stdout para pruebas locales.

### 2) Acceder al gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Qué se implementa

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

Edita el `AGENTS.md` en `scripts/k8s/manifests/configmap.yaml` y vuelve a implementar:

```bash
./scripts/k8s/deploy.sh
```

### Configuración del gateway

Edita `openclaw.json` en `scripts/k8s/manifests/configmap.yaml`. Consulta [Configuración del Gateway](/es/gateway/configuration) para la referencia completa.

### Agregar proveedores

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

### Namespace personalizado

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### Imagen personalizada

Edita el campo `image` en `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### Exponer más allá de port-forward

Los manifiestos predeterminados enlazan el gateway a loopback dentro del pod. Eso funciona con `kubectl port-forward`, pero no funciona con un `Service` de Kubernetes ni con una ruta de Ingress que necesite llegar a la IP del pod.

Si quieres exponer el gateway mediante un Ingress o un balanceador de carga:

- Cambia el enlace del gateway en `scripts/k8s/manifests/configmap.yaml` de `loopback` a un enlace que no sea loopback y que coincida con tu modelo de implementación
- Mantén habilitada la autenticación del gateway y usa un punto de entrada adecuado con terminación TLS
- Configura la interfaz de control para acceso remoto usando el modelo de seguridad web compatible (por ejemplo, HTTPS/Tailscale Serve y orígenes permitidos explícitos cuando sea necesario)

## Volver a implementar

```bash
./scripts/k8s/deploy.sh
```

Esto aplica todos los manifiestos y reinicia el pod para recoger cualquier cambio de configuración o secreto.

## Eliminación

```bash
./scripts/k8s/deploy.sh --delete
```

Esto elimina el namespace y todos los recursos que contiene, incluido el PVC.

## Notas de arquitectura

- El gateway se enlaza a loopback dentro del pod de forma predeterminada, por lo que la configuración incluida es para `kubectl port-forward`
- No hay recursos con alcance de clúster — todo reside en un único namespace
- Seguridad: `readOnlyRootFilesystem`, capacidades `drop: ALL`, usuario no root (UID 1000)
- La configuración predeterminada mantiene la interfaz de control en la ruta de acceso local más segura: enlace loopback más `kubectl port-forward` a `http://127.0.0.1:18789`
- Si vas más allá del acceso desde localhost, usa el modelo remoto compatible: HTTPS/Tailscale más el enlace de gateway adecuado y la configuración de origen de la interfaz de control
- Los secretos se generan en un directorio temporal y se aplican directamente al clúster — no se escribe material secreto en el checkout del repositorio

## Estructura de archivos

```
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
- [Runtime de Docker VM](/es/install/docker-vm-runtime)
- [Resumen de instalación](/es/install)
