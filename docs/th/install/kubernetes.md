---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw บนคลัสเตอร์ Kubernetes
    - คุณต้องการทดสอบ OpenClaw ในสภาพแวดล้อม Kubernetes
summary: ปรับใช้ OpenClaw Gateway ไปยังคลัสเตอร์ Kubernetes ด้วย Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-06-28T20:44:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a38c2754b4a5267e79854958a252b2e4bc9811da191d8ccf3ac597534cc8e7a
    source_path: install/kubernetes.md
    workflow: 16
---

จุดเริ่มต้นขั้นต่ำสำหรับการรัน OpenClaw บน Kubernetes — ไม่ใช่การปรับใช้ที่พร้อมสำหรับโปรดักชัน ครอบคลุมทรัพยากรหลักและตั้งใจให้ปรับให้เข้ากับสภาพแวดล้อมของคุณ

## ทำไมไม่ใช้ Helm?

OpenClaw เป็นคอนเทนเนอร์เดียวพร้อมไฟล์ config บางส่วน การปรับแต่งที่สำคัญอยู่ในเนื้อหาของ agent (ไฟล์ markdown, skills, config overrides) ไม่ใช่การทำเทมเพลตโครงสร้างพื้นฐาน Kustomize จัดการ overlays ได้โดยไม่มีภาระของ Helm chart หากการปรับใช้ของคุณซับซ้อนขึ้น สามารถวาง Helm chart ซ้อนทับบน manifests เหล่านี้ได้

## สิ่งที่คุณต้องมี

- คลัสเตอร์ Kubernetes ที่กำลังรันอยู่ (AKS, EKS, GKE, k3s, kind, OpenShift ฯลฯ)
- `kubectl` ที่เชื่อมต่อกับคลัสเตอร์ของคุณ
- API key สำหรับผู้ให้บริการโมเดลอย่างน้อยหนึ่งราย

## เริ่มต้นอย่างรวดเร็ว

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

ดึง shared secret ที่กำหนดค่าไว้สำหรับ Control UI สคริปต์ deploy นี้
สร้าง token auth เป็นค่าเริ่มต้น:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

สำหรับการดีบักในเครื่อง `./scripts/k8s/deploy.sh --show-token` จะพิมพ์ token หลัง deploy

## การทดสอบในเครื่องด้วย Kind

หากคุณไม่มีคลัสเตอร์ ให้สร้างคลัสเตอร์ในเครื่องด้วย [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

จากนั้น deploy ตามปกติด้วย `./scripts/k8s/deploy.sh`

## ทีละขั้นตอน

### 1) Deploy

**ตัวเลือก A** — API key ใน environment (ขั้นตอนเดียว):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

สคริปต์จะสร้าง Kubernetes Secret พร้อม API key และ gateway token ที่สร้างโดยอัตโนมัติ จากนั้นจึง deploy หาก Secret มีอยู่แล้ว สคริปต์จะคง gateway token ปัจจุบันและ provider keys ใด ๆ ที่ไม่ได้ถูกเปลี่ยนไว้

**ตัวเลือก B** — สร้าง secret แยกต่างหาก:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ใช้ `--show-token` กับคำสั่งใดก็ได้ หากคุณต้องการพิมพ์ token ไปยัง stdout สำหรับการทดสอบในเครื่อง

### 2) เข้าถึง gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## สิ่งที่จะถูก deploy

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## การปรับแต่ง

### คำแนะนำสำหรับ agent

แก้ไข `AGENTS.md` ใน `scripts/k8s/manifests/configmap.yaml` แล้ว deploy ใหม่:

```bash
./scripts/k8s/deploy.sh
```

### Gateway config

แก้ไข `openclaw.json` ใน `scripts/k8s/manifests/configmap.yaml` ดูข้อมูลอ้างอิงฉบับเต็มได้ที่ [การกำหนดค่า Gateway](/th/gateway/configuration)

### เพิ่มผู้ให้บริการ

รันใหม่โดย export keys เพิ่มเติม:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

provider keys ที่มีอยู่จะยังคงอยู่ใน Secret เว้นแต่คุณจะเขียนทับ

หรือ patch Secret โดยตรง:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### namespace แบบกำหนดเอง

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### image แบบกำหนดเอง

แก้ไขฟิลด์ `image` ใน `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # primary; official Docker Hub mirror: openclaw/openclaw:latest
```

### เปิดให้เข้าถึงเกิน port-forward

manifests ค่าเริ่มต้น bind gateway กับ loopback ภายใน pod วิธีนี้ใช้ได้กับ `kubectl port-forward` แต่ใช้ไม่ได้กับ Kubernetes `Service` หรือเส้นทาง Ingress ที่ต้องเข้าถึง pod IP

หากคุณต้องการเปิด gateway ผ่าน Ingress หรือ load balancer:

- เปลี่ยน gateway bind ใน `scripts/k8s/manifests/configmap.yaml` จาก `loopback` เป็น bind ที่ไม่ใช่ loopback ซึ่งตรงกับโมเดลการปรับใช้ของคุณ
- เปิดใช้ gateway auth ต่อไป และใช้ entrypoint ที่ terminate TLS อย่างเหมาะสม
- กำหนดค่า Control UI สำหรับการเข้าถึงระยะไกลโดยใช้โมเดลความปลอดภัยเว็บที่รองรับ (เช่น HTTPS/Tailscale Serve และ allowed origins แบบชัดเจนเมื่อจำเป็น)

## Deploy ใหม่

```bash
./scripts/k8s/deploy.sh
```

คำสั่งนี้จะ apply manifests ทั้งหมดและรีสตาร์ท pod เพื่อรับ config หรือ secret changes ใด ๆ

## ลบการปรับใช้

```bash
./scripts/k8s/deploy.sh --delete
```

คำสั่งนี้จะลบ namespace และทรัพยากรทั้งหมดในนั้น รวมถึง PVC

## หมายเหตุด้านสถาปัตยกรรม

- gateway bind กับ loopback ภายใน pod เป็นค่าเริ่มต้น ดังนั้นการตั้งค่าที่รวมมานี้มีไว้สำหรับ `kubectl port-forward`
- ไม่มีทรัพยากรระดับคลัสเตอร์ — ทุกอย่างอยู่ใน namespace เดียว
- ความปลอดภัย: `readOnlyRootFilesystem`, ความสามารถ `drop: ALL`, ผู้ใช้ที่ไม่ใช่ root (UID 1000)
- config ค่าเริ่มต้นทำให้ Control UI อยู่บนเส้นทางการเข้าถึงในเครื่องที่ปลอดภัยกว่า: loopback bind พร้อม `kubectl port-forward` ไปยัง `http://127.0.0.1:18789`
- หากคุณขยายเกินการเข้าถึง localhost ให้ใช้โมเดลระยะไกลที่รองรับ: HTTPS/Tailscale พร้อม gateway bind และการตั้งค่า origin ของ Control UI ที่เหมาะสม
- Secrets ถูกสร้างในไดเรกทอรีชั่วคราวและ apply ไปยังคลัสเตอร์โดยตรง — ไม่มี secret material ถูกเขียนลงใน repo checkout

## โครงสร้างไฟล์

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

## ที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [Docker VM runtime](/th/install/docker-vm-runtime)
- [ภาพรวมการติดตั้ง](/th/install)
