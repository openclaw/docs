---
read_when:
    - Quieres ejecutar OpenClaw en un clúster de Kubernetes
    - Quieres probar OpenClaw en un entorno de Kubernetes
summary: Implementa OpenClaw Gateway en un clúster de Kubernetes con Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-11T23:11:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

Un punto de partida mínimo para ejecutar OpenClaw en Kubernetes, no un despliegue listo para producción. Abarca los recursos principales y está pensado para adaptarse a su entorno.

## Por qué no usar Helm

OpenClaw es un único contenedor con algunos archivos de configuración. La personalización relevante está en el contenido del agente (archivos Markdown, Skills, anulaciones de configuración), no en las plantillas de infraestructura. Kustomize gestiona las superposiciones sin la sobrecarga de un chart de Helm. Añada un chart de Helm sobre estos manifiestos si su despliegue se vuelve más complejo.

## Qué necesita

- Un clúster de Kubernetes en ejecución (AKS, EKS, GKE, k3s, kind, OpenShift, etc.)
- `kubectl` conectado a su clúster
- Una clave de API para al menos un proveedor de modelos

## Inicio rápido

```bash
# Sustituya por su proveedor: ANTHROPIC, GEMINI, OPENAI u OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

`deploy.sh` crea autenticación mediante token de forma predeterminada. Obtenga el token generado del Gateway para la interfaz de control:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

Para la depuración local, `./scripts/k8s/deploy.sh --show-token` muestra el token después del despliegue.

## Pruebas locales con Kind

Si no dispone de un clúster, cree uno localmente con [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # detecta automáticamente docker o podman
./scripts/k8s/create-kind.sh --delete  # elimina el clúster
```

Después, despliegue de la forma habitual con `./scripts/k8s/deploy.sh`.

## Paso a paso

### 1) Desplegar

**Opción A: clave de API en el entorno (un paso)**

```bash
# Sustituya por su proveedor: ANTHROPIC, GEMINI, OPENAI u OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

El script crea un Secret de Kubernetes con la clave de API y un token del Gateway generado automáticamente y, a continuación, realiza el despliegue. Si el Secret ya existe, conserva el token actual del Gateway y cualquier clave de proveedor que no se esté modificando.

**Opción B: crear el secreto por separado**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Añada `--show-token` a cualquiera de los comandos para mostrar el token en stdout durante las pruebas locales.

### 2) Acceder al Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## Qué se despliega

```text
Espacio de nombres: openclaw (configurable mediante OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Pod único, contenedor de inicio + Gateway
├── Service/openclaw           # ClusterIP en el puerto 18789
├── PersistentVolumeClaim      # 10 Gi para el estado y la configuración del agente
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Token del Gateway + claves de API
```

## Personalización

### Instrucciones del agente

Edite el archivo `AGENTS.md` de `scripts/k8s/manifests/configmap.yaml` y vuelva a desplegar:

```bash
./scripts/k8s/deploy.sh
```

### Configuración del Gateway

Edite `openclaw.json` en `scripts/k8s/manifests/configmap.yaml`. Consulte [Configuración del Gateway](/es/gateway/configuration) para obtener la referencia completa.

### Añadir proveedores

Vuelva a ejecutar el proceso después de exportar las claves adicionales:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

Las claves de proveedores existentes permanecen en el Secret a menos que las sobrescriba.

También puede aplicar un parche directamente al Secret:

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

Edite el campo `image` en `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # principal; réplica oficial de Docker Hub: openclaw/openclaw
```

### Exponer más allá del reenvío de puertos

Los manifiestos predeterminados vinculan el Gateway a local loopback dentro del pod. Esto funciona con `kubectl port-forward`, pero no con un `Service` de Kubernetes ni con una ruta de Ingress que necesite acceder directamente a la IP del pod.

Para exponer el Gateway mediante un Ingress o un equilibrador de carga:

- Cambie la vinculación del Gateway en `scripts/k8s/manifests/configmap.yaml` de `loopback` a una vinculación que no sea local loopback y que coincida con su modelo de despliegue.
- Mantenga habilitada la autenticación del Gateway y utilice un punto de entrada adecuado con terminación TLS.
- Configure la interfaz de control para el acceso remoto mediante el modelo de seguridad web compatible (por ejemplo, HTTPS/Tailscale Serve y orígenes permitidos explícitos cuando sea necesario).

## Volver a desplegar

```bash
./scripts/k8s/deploy.sh
```

Esto aplica todos los manifiestos y reinicia el pod para que se apliquen los cambios de configuración o secretos.

## Desinstalación

```bash
./scripts/k8s/deploy.sh --delete
```

Esto elimina el espacio de nombres y todos sus recursos, incluido el PVC.

## Notas de arquitectura

- El Gateway se vincula de forma predeterminada a local loopback dentro del pod, por lo que la configuración incluida está pensada para `kubectl port-forward`.
- No hay recursos con ámbito de clúster; todo reside en un único espacio de nombres.
- Refuerzo de seguridad: `readOnlyRootFilesystem`, capacidades `drop: ALL` y usuario no root (UID 1000).
- La configuración predeterminada mantiene la interfaz de control en la ruta de acceso local más segura: vinculación a local loopback junto con `kubectl port-forward` a `http://127.0.0.1:18789`.
- Si necesita acceso más allá de localhost, utilice el modelo remoto compatible: HTTPS/Tailscale junto con la vinculación adecuada del Gateway y la configuración de orígenes de la interfaz de control.
- Los secretos se generan en un directorio temporal y se aplican directamente al clúster; no se escribe ningún material secreto en el checkout del repositorio.

## Estructura de archivos

```text
scripts/k8s/
├── deploy.sh                   # Crea el espacio de nombres y el secreto, y despliega mediante kustomize
├── create-kind.sh              # Clúster Kind local (detecta automáticamente docker/podman)
└── manifests/
    ├── kustomization.yaml      # Base de Kustomize
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # Especificación del pod con refuerzo de seguridad
    ├── pvc.yaml                # 10 Gi de almacenamiento persistente
    └── service.yaml            # ClusterIP en 18789
```

## Contenido relacionado

- [Docker](/es/install/docker)
- [Entorno de ejecución de máquina virtual Docker](/es/install/docker-vm-runtime)
- [Descripción general de la instalación](/es/install)
