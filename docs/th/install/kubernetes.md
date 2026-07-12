---
read_when:
    - คุณต้องการเรียกใช้ OpenClaw บนคลัสเตอร์ Kubernetes
    - คุณต้องการทดสอบ OpenClaw ในสภาพแวดล้อม Kubernetes
summary: ปรับใช้ OpenClaw Gateway ไปยังคลัสเตอร์ Kubernetes ด้วย Kustomize
title: Kubernetes
x-i18n:
    generated_at: "2026-07-12T16:16:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c05eb0eb923fa1f515aca1f6dcb6073aba69af0bdf30233243027edfedd45a39
    source_path: install/kubernetes.md
    workflow: 16
---

จุดเริ่มต้นแบบเรียบง่ายสำหรับใช้งาน OpenClaw บน Kubernetes ซึ่งยังไม่ใช่การติดตั้งใช้งานที่พร้อมสำหรับระบบจริง เนื้อหาครอบคลุมทรัพยากรหลักและมีไว้เพื่อให้ปรับให้เหมาะกับสภาพแวดล้อมของคุณ

## เหตุใดจึงไม่ใช้ Helm

OpenClaw เป็นคอนเทนเนอร์เดียวที่มีไฟล์การกำหนดค่าบางส่วน จุดที่ควรปรับแต่งคือเนื้อหาของเอเจนต์ (ไฟล์ Markdown, Skills และการเขียนทับการกำหนดค่า) ไม่ใช่การสร้างแม่แบบโครงสร้างพื้นฐาน Kustomize จัดการโอเวอร์เลย์ได้โดยไม่มีภาระส่วนเกินจากชาร์ต Helm หากการติดตั้งใช้งานของคุณซับซ้อนขึ้น คุณสามารถเพิ่มชาร์ต Helm ครอบไฟล์แมนิเฟสต์เหล่านี้ได้

## สิ่งที่คุณต้องมี

- คลัสเตอร์ Kubernetes ที่กำลังทำงานอยู่ (AKS, EKS, GKE, k3s, kind, OpenShift เป็นต้น)
- `kubectl` ที่เชื่อมต่อกับคลัสเตอร์ของคุณ
- คีย์ API สำหรับผู้ให้บริการโมเดลอย่างน้อยหนึ่งราย

## เริ่มต้นอย่างรวดเร็ว

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

โดยค่าเริ่มต้น `deploy.sh` จะสร้างการยืนยันตัวตนด้วยโทเค็น เรียกดูโทเค็น Gateway ที่สร้างขึ้นเพื่อใช้กับ UI ควบคุม:

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

สำหรับการดีบักภายในเครื่อง `./scripts/k8s/deploy.sh --show-token` จะแสดงโทเค็นหลังจากติดตั้งใช้งาน

## การทดสอบภายในเครื่องด้วย Kind

หากคุณไม่มีคลัสเตอร์ ให้สร้างคลัสเตอร์ภายในเครื่องด้วย [Kind](https://kind.sigs.k8s.io/):

```bash
./scripts/k8s/create-kind.sh           # auto-detects docker or podman
./scripts/k8s/create-kind.sh --delete  # tear down
```

จากนั้นติดตั้งใช้งานตามปกติด้วย `./scripts/k8s/deploy.sh`

## ขั้นตอนโดยละเอียด

### 1) ติดตั้งใช้งาน

**ตัวเลือก A: คีย์ API ในสภาพแวดล้อม (ขั้นตอนเดียว)**

```bash
# Replace with your provider: ANTHROPIC, GEMINI, OPENAI, or OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

สคริปต์จะสร้าง Kubernetes Secret ซึ่งมีคีย์ API และโทเค็น Gateway ที่สร้างโดยอัตโนมัติ จากนั้นจึงติดตั้งใช้งาน หาก Secret มีอยู่แล้ว สคริปต์จะคงโทเค็น Gateway ปัจจุบันและคีย์ของผู้ให้บริการที่ไม่ได้กำลังถูกเปลี่ยนแปลงไว้

**ตัวเลือก B: สร้าง Secret แยกต่างหาก**

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

เพิ่ม `--show-token` ให้กับคำสั่งใดคำสั่งหนึ่งเพื่อแสดงโทเค็นไปยัง stdout สำหรับการทดสอบภายในเครื่อง

### 2) เข้าถึง Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## สิ่งที่จะได้รับการติดตั้งใช้งาน

```text
Namespace: openclaw (configurable via OPENCLAW_NAMESPACE)
├── Deployment/openclaw        # Single pod, init container + gateway
├── Service/openclaw           # ClusterIP on port 18789
├── PersistentVolumeClaim      # 10Gi for agent state and config
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API keys
```

## การปรับแต่ง

### คำสั่งสำหรับเอเจนต์

แก้ไข `AGENTS.md` ใน `scripts/k8s/manifests/configmap.yaml` แล้วติดตั้งใช้งานอีกครั้ง:

```bash
./scripts/k8s/deploy.sh
```

### การกำหนดค่า Gateway

แก้ไข `openclaw.json` ใน `scripts/k8s/manifests/configmap.yaml` ดูข้อมูลอ้างอิงฉบับเต็มได้ที่ [การกำหนดค่า Gateway](/th/gateway/configuration)

### เพิ่มผู้ให้บริการ

เรียกใช้อีกครั้งโดยส่งออกคีย์เพิ่มเติม:

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

คีย์ของผู้ให้บริการที่มีอยู่จะยังคงอยู่ใน Secret เว้นแต่คุณจะเขียนทับคีย์เหล่านั้น

หรือแพตช์ Secret โดยตรง:

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### เนมสเปซแบบกำหนดเอง

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### อิมเมจแบบกำหนดเอง

แก้ไขฟิลด์ `image` ใน `scripts/k8s/manifests/deployment.yaml`:

```yaml
image: ghcr.io/openclaw/openclaw:slim # primary; official Docker Hub mirror: openclaw/openclaw
```

### เปิดให้เข้าถึงได้โดยไม่ผ่านการส่งต่อพอร์ต

โดยค่าเริ่มต้น ไฟล์แมนิเฟสต์จะผูก Gateway กับ local loopback ภายในพ็อด ซึ่งทำงานร่วมกับ `kubectl port-forward` ได้ แต่ไม่สามารถใช้กับ `Service` ของ Kubernetes หรือเส้นทาง Ingress ที่จำเป็นต้องเข้าถึง IP ของพ็อดโดยตรง

หากต้องการเปิดให้เข้าถึง Gateway ผ่าน Ingress หรือตัวจัดสรรภาระงาน:

- เปลี่ยนการผูก Gateway ใน `scripts/k8s/manifests/configmap.yaml` จาก `loopback` เป็นการผูกแบบที่ไม่ใช่ loopback ซึ่งตรงกับรูปแบบการติดตั้งใช้งานของคุณ
- เปิดใช้งานการยืนยันตัวตนของ Gateway ไว้ และใช้จุดเข้าที่สิ้นสุด TLS อย่างเหมาะสม
- กำหนดค่า UI ควบคุมสำหรับการเข้าถึงระยะไกลโดยใช้โมเดลความปลอดภัยเว็บที่รองรับ (เช่น HTTPS/Tailscale Serve และระบุต้นทางที่อนุญาตอย่างชัดเจนเมื่อจำเป็น)

## ติดตั้งใช้งานอีกครั้ง

```bash
./scripts/k8s/deploy.sh
```

คำสั่งนี้จะใช้ไฟล์แมนิเฟสต์ทั้งหมดและรีสตาร์ตพ็อดเพื่อโหลดการเปลี่ยนแปลงการกำหนดค่าหรือ Secret

## รื้อถอน

```bash
./scripts/k8s/deploy.sh --delete
```

คำสั่งนี้จะลบเนมสเปซและทรัพยากรทั้งหมดภายใน รวมถึง PVC

## หมายเหตุด้านสถาปัตยกรรม

- โดยค่าเริ่มต้น Gateway จะผูกกับ local loopback ภายในพ็อด ดังนั้นการตั้งค่าที่ให้มาจึงมีไว้สำหรับ `kubectl port-forward`
- ไม่มีทรัพยากรระดับคลัสเตอร์ ทุกอย่างอยู่ภายในเนมสเปซเดียว
- การเสริมความปลอดภัย: `readOnlyRootFilesystem`, ความสามารถ `drop: ALL` และผู้ใช้ที่ไม่ใช่ root (UID 1000)
- การกำหนดค่าเริ่มต้นกำหนดให้ UI ควบคุมใช้เส้นทางการเข้าถึงภายในเครื่องที่ปลอดภัยกว่า ได้แก่ การผูกกับ loopback ร่วมกับ `kubectl port-forward` ไปยัง `http://127.0.0.1:18789`
- หากคุณเปลี่ยนไปใช้การเข้าถึงนอก localhost ให้ใช้รูปแบบระยะไกลที่รองรับ ได้แก่ HTTPS/Tailscale พร้อมการผูก Gateway และการตั้งค่าต้นทางของ UI ควบคุมที่เหมาะสม
- Secret จะถูกสร้างในไดเรกทอรีชั่วคราวและนำไปใช้กับคลัสเตอร์โดยตรง โดยจะไม่มีการเขียนข้อมูลลับลงในสำเนาเช็กเอาต์ของรีโพซิทอรี

## โครงสร้างไฟล์

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

## เนื้อหาที่เกี่ยวข้อง

- [Docker](/th/install/docker)
- [รันไทม์ Docker VM](/th/install/docker-vm-runtime)
- [ภาพรวมการติดตั้ง](/th/install)
