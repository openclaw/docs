---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw บนคลัสเตอร์ Kubernetes
    - คุณต้องการทดสอบ OpenClaw ในสภาพแวดล้อม Kubernetes
summary: ปรับใช้ OpenClaw Gateway ไปยังคลัสเตอร์ Kubernetes ด้วย Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-05-06T09:19:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c38e42ae9121864333574b668d95f4d1112cada30cd525613d2371f176de4505
    source_path: install/kubernetes.md
    workflow: 16
    postprocess_version: locale-links-v1
---

จุดเริ่มต้นขั้นต่ำสำหรับการรัน OpenClaw บน Kubernetes — ไม่ใช่การปรับใช้ที่พร้อมสำหรับงานโปรดักชัน เนื้อหานี้ครอบคลุมทรัพยากรหลักและตั้งใจให้คุณปรับให้เข้ากับสภาพแวดล้อมของคุณ

## ทำไมไม่ใช้ Helm?

OpenClaw เป็นคอนเทนเนอร์เดียวพร้อมไฟล์คอนฟิกบางส่วน ส่วนที่น่าสนใจในการปรับแต่งอยู่ในเนื้อหาของเอเจนต์ (ไฟล์ markdown, skills, การ override คอนฟิก) ไม่ใช่การทำเทมเพลตโครงสร้างพื้นฐาน Kustomize จัดการ overlay ได้โดยไม่มีภาระของ Helm chart หากการปรับใช้ของคุณซับซ้อนขึ้น ก็สามารถวาง Helm chart ทับบน manifest เหล่านี้ได้

## สิ่งที่คุณต้องมี

- คลัสเตอร์ Kubernetes ที่กำลังทำงานอยู่ (AKS, EKS, GKE, k3s, kind, OpenShift ฯลฯ)
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

ดึง shared secret ที่กำหนดค่าไว้สำหรับ Control UI สคริปต์ปรับใช้นี้
สร้างการยืนยันตัวตนด้วยโทเค็นตามค่าเริ่มต้น:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

สำหรับการดีบักในเครื่อง `./scripts/k8s/deploy.sh --show-token` จะพิมพ์โทเค็นหลังจากปรับใช้

## การทดสอบในเครื่องด้วย Kind

หากคุณไม่มีคลัสเตอร์ ให้สร้างในเครื่องด้วย [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

จากนั้นปรับใช้ตามปกติด้วย `./scripts/k8s/deploy.sh`

## ทีละขั้นตอน

### 1) ปรับใช้

**ตัวเลือก A** — API key ในสภาพแวดล้อม (ขั้นตอนเดียว):

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

สคริปต์จะสร้าง Kubernetes Secret พร้อม API key และ gateway token ที่สร้างอัตโนมัติ จากนั้นจึงปรับใช้ หาก Secret มีอยู่แล้ว สคริปต์จะคง gateway token ปัจจุบันและคีย์ของผู้ให้บริการใดๆ ที่ไม่ได้เปลี่ยนไว้

**ตัวเลือก B** — สร้าง secret แยกต่างหาก:

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

ใช้ `--show-token` กับคำสั่งใดก็ได้หากคุณต้องการให้พิมพ์โทเค็นไปยัง stdout สำหรับการทดสอบในเครื่อง

### 2) เข้าถึง gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## สิ่งที่จะถูกปรับใช้

```
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## การปรับแต่ง

### คำสั่งสำหรับเอเจนต์

แก้ไข `AGENTS.md` ใน `scripts/k8s/manifests/configmap.yaml` แล้วปรับใช้อีกครั้ง:

```bash
./scripts/k8s/deploy.sh
```

### คอนฟิก Gateway

แก้ไข `openclaw.json` ใน `scripts/k8s/manifests/configmap.yaml` ดูข้อมูลอ้างอิงทั้งหมดที่ [การกำหนดค่า Gateway](/th/gateway/configuration)

### เพิ่มผู้ให้บริการ

รันอีกครั้งโดย export คีย์เพิ่มเติม:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

คีย์ของผู้ให้บริการที่มีอยู่จะยังคงอยู่ใน Secret เว้นแต่คุณจะเขียนทับ

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

### อิมเมจแบบกำหนดเอง

แก้ไขฟิลด์ `image` ใน `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:latest # or pin to a specific version from https://github.com/openclaw/openclaw/releases
```

### เปิดให้เข้าถึงนอกเหนือจาก port-forward

manifest เริ่มต้นจะ bind gateway เข้ากับ loopback ภายใน pod ซึ่งทำงานได้กับ `kubectl port-forward` แต่ใช้ไม่ได้กับ Kubernetes `Service` หรือเส้นทาง Ingress ที่ต้องเข้าถึง IP ของ pod

หากคุณต้องการเปิด gateway ผ่าน Ingress หรือ load balancer:

- เปลี่ยน gateway bind ใน `scripts/k8s/manifests/configmap.yaml` จาก `loopback` เป็น bind ที่ไม่ใช่ loopback ซึ่งตรงกับโมเดลการปรับใช้ของคุณ
- เปิดใช้งาน gateway auth ไว้ และใช้ entrypoint ที่ยุติ TLS อย่างเหมาะสม
- กำหนดค่า Control UI สำหรับการเข้าถึงระยะไกลโดยใช้โมเดลความปลอดภัยเว็บที่รองรับ (เช่น HTTPS/Tailscale Serve และ allowed origins แบบระบุชัดเจนเมื่อจำเป็น)

## ปรับใช้อีกครั้ง

```bash
./scripts/k8s/deploy.sh
```

คำสั่งนี้จะ apply manifest ทั้งหมดและรีสตาร์ต pod เพื่อรับการเปลี่ยนแปลงคอนฟิกหรือ secret ใดๆ

## ลบทิ้ง

```bash
./scripts/k8s/deploy.sh --delete
```

คำสั่งนี้จะลบ namespace และทรัพยากรทั้งหมดในนั้น รวมถึง PVC

## หมายเหตุด้านสถาปัตยกรรม

- gateway bind เข้ากับ loopback ภายใน pod ตามค่าเริ่มต้น ดังนั้นชุดติดตั้งที่รวมมานี้จึงมีไว้สำหรับ `kubectl port-forward`
- ไม่มีทรัพยากรระดับคลัสเตอร์ — ทุกอย่างอยู่ใน namespace เดียว
- ความปลอดภัย: `readOnlyRootFilesystem`, ความสามารถ `drop: ALL`, ผู้ใช้ที่ไม่ใช่ root (UID 1000)
- คอนฟิกเริ่มต้นจะทำให้ Control UI อยู่บนเส้นทางการเข้าถึงในเครื่องที่ปลอดภัยกว่า: loopback bind พร้อม `kubectl port-forward` ไปยัง `http://127.0.0.1:18789`
- หากคุณขยายออกไปนอกการเข้าถึง localhost ให้ใช้โมเดลระยะไกลที่รองรับ: HTTPS/Tailscale พร้อม gateway bind ที่เหมาะสมและการตั้งค่า origin ของ Control UI
- Secrets ถูกสร้างในไดเรกทอรีชั่วคราวและนำไปใช้กับคลัสเตอร์โดยตรง — ไม่มีการเขียนข้อมูล secret ลงใน repo checkout

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
- [รันไทม์ Docker VM](/th/install/docker-vm-runtime)
- [ภาพรวมการติดตั้ง](/th/install)
