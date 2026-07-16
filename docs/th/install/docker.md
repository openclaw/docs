---
read_when:
    - คุณต้องการ Gateway แบบคอนเทนเนอร์แทนการติดตั้งในเครื่อง
    - คุณกำลังตรวจสอบความถูกต้องของขั้นตอนการทำงานของ Docker
summary: การตั้งค่าและการเริ่มต้นใช้งาน OpenClaw ผ่าน Docker ซึ่งเป็นทางเลือกเพิ่มเติม
title: Docker
x-i18n:
    generated_at: "2026-07-16T19:14:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker เป็นสิ่งที่ **ไม่บังคับ** ใช้สำหรับสภาพแวดล้อม Gateway แบบแยกอิสระที่พร้อมทิ้ง หรือโฮสต์ที่ไม่มีการติดตั้งภายในเครื่อง หากพัฒนาอยู่บนเครื่องของตนเองอยู่แล้ว ให้ใช้ขั้นตอนการติดตั้งปกติแทน

แบ็กเอนด์ Sandbox เริ่มต้นใช้ Docker เมื่อเปิดใช้งาน `agents.defaults.sandbox` แต่ Sandbox ปิดอยู่โดยค่าเริ่มต้น และไม่จำเป็นต้องให้ Gateway เองทำงานใน Docker นอกจากนี้ยังมีแบ็กเอนด์ Sandbox แบบ SSH และ OpenShell โปรดดู [การใช้ Sandbox](/th/gateway/sandboxing)

โฮสต์ผู้ใช้หลายรายใช่หรือไม่ โปรดดู [การโฮสต์แบบหลายผู้เช่า](/th/gateway/multi-tenant-hosting) สำหรับโมเดลหนึ่งเซลล์ต่อผู้เช่า

## ข้อกำหนดเบื้องต้น

- Docker Desktop (หรือ Docker Engine) + Docker Compose v2
- RAM อย่างน้อย 2 GB สำหรับการสร้างอิมเมจ (`pnpm install` อาจถูกยุติเนื่องจาก OOM บนโฮสต์ขนาด 1 GB โดยมีรหัสออก 137)
- พื้นที่ดิสก์เพียงพอสำหรับอิมเมจและบันทึก
- บน VPS/โฮสต์สาธารณะ ให้ตรวจสอบ [การเสริมความปลอดภัยสำหรับการเปิดใช้งานผ่านเครือข่าย](/th/gateway/security) โดยเฉพาะเชนไฟร์วอลล์ `DOCKER-USER` ของ Docker

## Gateway แบบคอนเทนเนอร์

<Steps>
  <Step title="สร้างอิมเมจ">
    จากรูทของรีโพ:

    ```bash
    ./scripts/docker/setup.sh
    ```

    คำสั่งนี้สร้างอิมเมจ Gateway ภายในเครื่องเป็น `openclaw:local` หากต้องการใช้อิมเมจที่สร้างไว้ล่วงหน้าแทน:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    อิมเมจที่สร้างไว้ล่วงหน้าจะเผยแพร่ไปยัง [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw) ก่อน GHCR เป็นรีจิสทรีหลักสำหรับระบบอัตโนมัติของการเผยแพร่ การปรับใช้แบบตรึงเวอร์ชัน และการตรวจสอบแหล่งที่มา รุ่นเดียวกันจะเผยแพร่มิเรอร์ Docker Hub ที่ `openclaw/openclaw` ด้วย:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    ใช้ `ghcr.io/openclaw/openclaw` หรือ `openclaw/openclaw` และหลีกเลี่ยงมิเรอร์ที่ไม่เป็นทางการ ซึ่งไม่ได้ใช้กำหนดเวลาการเผยแพร่หรือนโยบายการเก็บรักษาเดียวกับ OpenClaw แท็กอย่างเป็นทางการ ได้แก่ `main`, `latest`, `<version>` (เช่น `2026.2.26`) และแท็กเบตา เช่น `2026.2.26-beta.1` (รุ่นเบตาจะไม่เลื่อน `latest`/`main`) อิมเมจเริ่มต้น `main`/`latest`/`<version>` รวม Plugin `codex` และ `diagnostics-otel` ไว้ด้วย นอกจากนี้ยังมีตัวแปร `-browser` (เช่น `latest-browser`) ซึ่งมาพร้อม Chromium ภายในอิมเมจ เหมาะสำหรับเครื่องมือ [เบราว์เซอร์ใน Sandbox](/th/gateway/sandboxing#sandboxed-browser) โดยไม่ต้องติดตั้ง Playwright ในการเรียกใช้ครั้งแรก

  </Step>

  <Step title="เรียกใช้อีกครั้งในระบบที่ตัดขาดจากเครือข่าย">
    บนโฮสต์ออฟไลน์ ให้ถ่ายโอนและโหลดอิมเมจก่อน:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` ตรวจสอบว่า `OPENCLAW_IMAGE` มีอยู่ภายในเครื่องแล้ว ปิดการดึง/สร้างโดยนัยของ Compose จากนั้นเรียกใช้ขั้นตอนปกติ ได้แก่ การซิงค์ `.env` การแก้ไขสิทธิ์ การเริ่มต้นใช้งาน การซิงค์การกำหนดค่า Gateway และการเริ่มต้น Compose

    หาก `OPENCLAW_SANDBOX=1` การตั้งค่าแบบออฟไลน์จะตรวจสอบอิมเมจ Sandbox เริ่มต้นที่กำหนดค่าไว้และอิมเมจ Sandbox รายเอเจนต์บนดีมอนที่อยู่หลัง `OPENCLAW_DOCKER_SOCKET` ด้วย รวมถึงป้ายกำกับสัญญาเบราว์เซอร์บนอิมเมจเบราว์เซอร์ที่ใช้ Docker หากอิมเมจที่จำเป็นขาดหายหรือล้าสมัย การตั้งค่าจะออกโดยไม่เปลี่ยนแปลงการกำหนดค่า Sandbox แทนที่จะรายงานความสำเร็จที่ใช้งานไม่ได้

  </Step>

  <Step title="ดำเนินการเริ่มต้นใช้งานให้เสร็จสมบูรณ์">
    สคริปต์การตั้งค่าดำเนินการเริ่มต้นใช้งานโดยอัตโนมัติ:

    - แจ้งให้ป้อนคีย์ API ของผู้ให้บริการ
    - สร้างโทเค็น Gateway และเขียนลงใน `.env`
    - สร้างไดเรกทอรีคีย์ลับของโปรไฟล์การยืนยันตัวตน
    - เริ่ม Gateway ผ่าน Docker Compose

    การเริ่มต้นใช้งานก่อนเริ่มทำงานและการเขียนการกำหนดค่าจะดำเนินการผ่าน `openclaw-gateway` โดยตรง (พร้อม `--no-deps --entrypoint node`) เนื่องจาก `openclaw-cli` ใช้เนมสเปซเครือข่ายร่วมกับ Gateway และทำงานได้ต่อเมื่อมีคอนเทนเนอร์ Gateway อยู่แล้วเท่านั้น

  </Step>

  <Step title="เปิด Control UI">
    เปิด `http://127.0.0.1:18789/` และวางโทเค็นที่เขียนไว้ใน `.env` ลงใน Settings หากเปลี่ยนคอนเทนเนอร์ไปใช้การยืนยันตัวตนด้วยรหัสผ่าน ให้ใช้รหัสผ่านนั้นแทน

    ต้องการ URL อีกครั้งหรือไม่

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="กำหนดค่าช่องทาง (ไม่บังคับ)">
    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    เอกสาร: [WhatsApp](/th/channels/whatsapp), [Telegram](/th/channels/telegram), [Discord](/th/channels/discord)

  </Step>
</Steps>

### ขั้นตอนแบบดำเนินการเอง

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

บริบท Docker ไม่รวม `.git` ส่งข้อมูลระบุซอร์สเป็นอาร์กิวเมนต์การสร้าง
ตามที่แสดงด้านบน เพื่อให้หน้าจอ About ของอิมเมจรายงานคอมมิตที่เช็กเอาต์และ
เวลาประทับการสร้างหนึ่งค่า `scripts/docker/setup.sh` จะกำหนดและส่งค่าทั้งสอง
โดยอัตโนมัติ

<Note>
เรียกใช้ `docker compose` จากรูทของรีโพ หากเปิดใช้งาน `OPENCLAW_EXTRA_MOUNTS` หรือ `OPENCLAW_HOME_VOLUME` สคริปต์การตั้งค่าจะเขียน `docker-compose.extra.yml`; ให้รวมไฟล์นี้หลัง `docker-compose.override.yml` ใดๆ ที่ดูแลเอง เช่น `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
</Note>

### การอัปเกรดอิมเมจคอนเทนเนอร์

เมื่อแทนที่อิมเมจ OpenClaw แต่ยังคงใช้สถานะ/การกำหนดค่าที่เมานต์ไว้ชุดเดิม
Gateway ใหม่จะเรียกใช้การย้ายข้อมูลสำหรับการอัปเกรดที่ปลอดภัยในระหว่างการเริ่มต้น และทำให้ Plugin สอดคล้องกันก่อน
เข้าสู่สถานะพร้อมใช้งาน การอัปเกรดอิมเมจตามปกติไม่ควรต้องเรียกใช้
`openclaw doctor --fix` แยกต่างหาก

หากการเริ่มต้นไม่สามารถดำเนินการซ่อมแซมเหล่านั้นให้เสร็จสิ้นอย่างปลอดภัย Gateway จะออกแทนที่จะ
รายงานว่าพร้อมใช้งาน เมื่อมีนโยบายการรีสตาร์ต Docker, Podman หรือ Kubernetes อาจแสดงว่า
คอนเทนเนอร์ Gateway กำลังรีสตาร์ต ให้เก็บวอลุ่มสถานะที่เมานต์ไว้ จากนั้นเรียกใช้อิมเมจ
เดียวกันหนึ่งครั้งโดยใช้ `openclaw doctor --fix` เป็นคำสั่งของคอนเทนเนอร์ และใช้
การเมานต์สถานะ/การกำหนดค่าชุดเดียวกับที่ Gateway ใช้:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

หลังจาก doctor ทำงานเสร็จ ให้รีสตาร์ตคอนเทนเนอร์ Gateway ด้วยคำสั่งเริ่มต้น
ใน Kubernetes ให้เรียกใช้คำสั่งเดียวกันใน Job แบบครั้งเดียวหรือพ็อดดีบักที่เมานต์กับ
PVC เดียวกัน จากนั้นรีสตาร์ต Deployment หรือ StatefulSet

### ตัวแปรสภาพแวดล้อม

ตัวแปรที่ไม่บังคับซึ่ง `scripts/docker/setup.sh` รองรับ (และคอนเทนเนอร์ Gateway รองรับโดยตรงผ่าน `docker-compose.yml`):

| ตัวแปร                                        | วัตถุประสงค์                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | ใช้อิมเมจระยะไกลแทนการสร้างภายในเครื่อง                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | ติดตั้งแพ็กเกจ apt เพิ่มเติมระหว่างการสร้าง (คั่นด้วยช่องว่าง) ชื่อแทนแบบเดิม: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | ติดตั้งแพ็กเกจ Python เพิ่มเติมระหว่างการสร้าง (คั่นด้วยช่องว่าง)                                                      |
| `OPENCLAW_EXTENSIONS`                           | คอมไพล์/จัดแพ็กเกจ Plugin ที่เลือกรองรับ และติดตั้งการขึ้นต่อกันสำหรับรันไทม์ (รหัสคั่นด้วยจุลภาคหรือช่องว่าง) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | แทนที่ตัวเลือก Node สำหรับการสร้างจากซอร์สภายในเครื่อง (ค่าเริ่มต้น `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | แทนที่ฮีป tsdown สำหรับการสร้างจากซอร์สภายในเครื่อง หน่วย MB                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | ข้ามเอาต์พุตคำประกาศระหว่างการสร้างอิมเมจภายในเครื่องสำหรับรันไทม์เท่านั้น (ค่าเริ่มต้น `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | ฝัง Chromium + Xvfb ลงในอิมเมจขณะสร้าง                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | การเมานต์แบบผูกกับโฮสต์เพิ่มเติม (`source:target[:opts]` คั่นด้วยจุลภาค)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | เก็บ `/home/node` ไว้ถาวรในวอลุ่ม Docker ที่มีชื่อ                                                                     |
| `OPENCLAW_SANDBOX`                              | เลือกใช้การเริ่มระบบ Sandbox (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | ข้ามขั้นตอนการเริ่มต้นใช้งานแบบโต้ตอบ (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | แทนที่พาธซ็อกเก็ต Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | บังคับเปิด (`0`) หรือปิด (`1`) การประกาศ Bonjour/mDNS โปรดดู [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | ปิดโอเวอร์เลย์การเมานต์แบบผูกสำหรับซอร์สของ Plugin ที่รวมมา                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | ปลายทางตัวรวบรวม OTLP/HTTP ที่ใช้ร่วมกันสำหรับการส่งออก OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | ปลายทาง OTLP เฉพาะสัญญาณสำหรับเทรซ เมตริก หรือบันทึก                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | แทนที่โปรโตคอล OTLP ปัจจุบันรองรับเฉพาะ `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | ชื่อบริการที่ใช้สำหรับทรัพยากร OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | เลือกใช้แอตทริบิวต์เชิงความหมาย GenAI รุ่นทดลองล่าสุด                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | ข้ามการเริ่ม OpenTelemetry SDK ชุดที่สองเมื่อโหลดไว้ล่วงหน้าแล้ว                                                    |

อิมเมจอย่างเป็นทางการไม่มี Homebrew ระหว่างการเริ่มต้นใช้งาน OpenClaw จะซ่อนตัวติดตั้งการขึ้นต่อกันของ Skills ที่รองรับเฉพาะ brew ในคอนเทนเนอร์ Linux ที่ไม่มี `brew`; ให้จัดเตรียมการขึ้นต่อกันเหล่านั้นผ่านอิมเมจที่กำหนดเองหรือติดตั้งด้วยตนเอง ใช้ `OPENCLAW_IMAGE_APT_PACKAGES` สำหรับการขึ้นต่อกันที่จัดเป็นแพ็กเกจ Debian และ `OPENCLAW_IMAGE_PIP_PACKAGES` สำหรับการขึ้นต่อกันของ Python (เรียกใช้ `python3 -m pip install --break-system-packages` ขณะสร้าง ดังนั้นให้ตรึงเวอร์ชันและใช้เฉพาะดัชนีที่เชื่อถือได้)

หาก Docker รายงาน `ResourceExhausted`, `cannot allocate memory` หรือยุติระหว่าง `tsdown` ให้เพิ่มขีดจำกัดหน่วยความจำของตัวสร้าง Docker หรือลองอีกครั้งด้วยขนาดฮีปที่ระบุให้เล็กลง:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### อิมเมจที่สร้างจากซอร์สพร้อม Plugin ที่เลือก

`OPENCLAW_EXTENSIONS` เลือก id ของ manifest Plugin จาก checkout ของซอร์ส;
ระบบยังยอมรับชื่อไดเรกทอรีซอร์สที่มีอยู่เดิมเมื่อชื่อแตกต่างกันด้วย การ build Docker
จะแปลงรายการที่เลือกเป็นไดเรกทอรีซอร์สเพียงครั้งเดียว ติดตั้ง dependency
สำหรับ production และเมื่อ Plugin ที่เลือกเผยแพร่แยกต่างหากพร้อม
`openclaw.build.bundledDist: false` จะคอมไพล์ runtime ของ Plugin นั้นเข้าใน dist แบบรวมของรูท
การจัดแพ็กเกจเฉพาะ Docker นี้ไม่เปลี่ยนสัญญา artifact ของ npm หรือ ClawHub
สำหรับ Plugin การใช้ id ที่ไม่รู้จัก ไม่ถูกต้อง หรือกำกวมจะทำให้การ build image ล้มเหลว
id ที่รู้จักซึ่งใช้เฉพาะ dependency/ซอร์สจะคงการ staging ซอร์สและ dependency
เดิมไว้ โดยไม่เพิ่มรายการ dist ที่คอมไพล์แล้วในรูท Plugin ที่เลือกซึ่งมี
รายการ build แบบรวมต้องคอมไพล์สำเร็จ ส่วนซอร์สและเอาต์พุต runtime
ของ Plugin ภายนอกที่ไม่ได้เลือกจะถูกตัดออก

ตัวอย่างเช่น คำสั่งเหล่านี้ build image Gateway แบบสแตนด์อโลนหลายสถาปัตยกรรม
แยกกันสำหรับ ClickClack, Slack และ Microsoft Teams ของ FakeCo โดย ClawRouter
เป็นส่วนหนึ่งของ runtime หลักของ OpenClaw อยู่แล้ว ดังนั้น image ของ ClickClack จึงเลือกเฉพาะ
`clickclack` อาร์กิวเมนต์เบราว์เซอร์ที่กำหนดเป็นค่าว่างอย่างชัดเจนช่วยให้ image เริ่มต้น
ไม่มี Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

ใช้ `--platform linux/arm64 --load` หรือ `--platform linux/amd64 --load` สำหรับ
การ build แบบเนทีฟในเครื่องเพียงแพลตฟอร์มเดียว เอาต์พุตหลายแพลตฟอร์มและ SBOM/provenance
ที่แนบมาด้วยต้องใช้ registry หรือเอาต์พุต Buildx อื่นที่เก็บรักษา attestation ไว้ หลังจาก
push แล้ว ให้ตรวจสอบ manifest และ deploy digest ที่เปลี่ยนแปลงไม่ได้ แทน tag
source-SHA ที่เปลี่ยนแปลงได้:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# นำไปใช้งาน: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

image เหล่านี้มีไว้สำหรับ Gateway แบบสแตนด์อโลนที่ใช้ OCI และผู้ใช้ Docker ทั่วไป
Gateway ที่จัดการด้วย Crabhelm จะไม่ใช้ image เหล่านี้ เส้นทางการส่งมอบดังกล่าวจะ build
ไฟล์ archive ของ appliance แบบ x86_64 แยกต่างหาก ซึ่งบรรจุ npm tarball ของ OpenClaw และตรึง
digest ของ Node, archive และ manifest ให้ build appliance นั้นแยกต่างหาก
จากซอร์ส OpenClaw ชุดเดียวกันที่รวมเข้าแล้ว

หากต้องการทดสอบซอร์ส Plugin ที่รวมมาด้วยกับ image ที่จัดแพ็กเกจแล้ว ให้ mount ไดเรกทอรีซอร์สของ Plugin หนึ่งรายการทับ path ซอร์สที่จัดแพ็กเกจไว้ เช่น `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro` การทำเช่นนี้จะแทนที่ bundle `/app/dist/extensions/synology-chat` ที่คอมไพล์แล้วซึ่งตรงกัน สำหรับ id ของ Plugin เดียวกัน

### การสังเกตการณ์

การส่งออก OpenTelemetry เป็นการเชื่อมต่อขาออกจากคอนเทนเนอร์ Gateway ไปยังตัวรวบรวม OTLP จึงไม่จำเป็นต้องเผยแพร่พอร์ต Docker หากต้องการรวม exporter ที่มาพร้อมระบบไว้ใน image ที่ build ในเครื่อง:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

image ที่ build ไว้ล่วงหน้าอย่างเป็นทางการมี `diagnostics-otel` รวมอยู่แล้ว ให้ติดตั้ง `clawhub:@openclaw/diagnostics-otel` ด้วยตนเองเฉพาะเมื่อคุณนำออกไปแล้วเท่านั้น หากต้องการเปิดใช้การส่งออก ให้อนุญาตและเปิดใช้ Plugin `diagnostics-otel` ใน config จากนั้นตั้งค่า `diagnostics.otel.enabled=true` (ดูตัวอย่างฉบับเต็มใน [การส่งออก OpenTelemetry](/th/gateway/opentelemetry)) ส่วน header สำหรับการยืนยันตัวตนของตัวรวบรวมให้ส่งผ่าน `diagnostics.otel.headers` ไม่ใช่ตัวแปรสภาพแวดล้อม Docker

เมตริก Prometheus ใช้พอร์ต Gateway ที่เผยแพร่อยู่แล้วซ้ำ ติดตั้ง `clawhub:@openclaw/diagnostics-prometheus` เปิดใช้ Plugin `diagnostics-prometheus` แล้วจึง scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

เส้นทางนี้ได้รับการป้องกันด้วยการยืนยันตัวตนของ Gateway อย่าเปิดเผยพอร์ตสาธารณะ `/metrics` แยกต่างหากหรือเส้นทาง reverse proxy ที่ไม่มีการยืนยันตัวตน ดู [เมตริก Prometheus](/th/gateway/prometheus)

### การตรวจสอบสถานะ

endpoint สำหรับ probe คอนเทนเนอร์ (ไม่ต้องยืนยันตัวตน):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # การทำงานอยู่
curl -fsS http://127.0.0.1:18789/readyz     # ความพร้อม
```

`HEALTHCHECK` ที่มีมาใน image จะ ping `/healthz` หากล้มเหลวซ้ำหลายครั้ง คอนเทนเนอร์จะถูกทำเครื่องหมายเป็น `unhealthy` เพื่อให้ orchestrator สามารถรีสตาร์ตหรือแทนที่ได้

snapshot สถานะเชิงลึกที่ต้องยืนยันตัวตน:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN เทียบกับ loopback

`scripts/docker/setup.sh` ใช้ค่าเริ่มต้นเป็น `OPENCLAW_GATEWAY_BIND=lan` เพื่อให้ `http://127.0.0.1:18789` บนโฮสต์ทำงานร่วมกับการเผยแพร่พอร์ต Docker ได้

- `lan` (ค่าเริ่มต้น): เบราว์เซอร์และ CLI บนโฮสต์เข้าถึงพอร์ต Gateway ที่เผยแพร่ได้
- `loopback`: เฉพาะโปรเซสภายใน namespace เครือข่ายของคอนเทนเนอร์เท่านั้นที่เข้าถึง Gateway โดยตรงได้

<Note>
ใช้ค่าของโหมด bind ใน `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`) ไม่ใช่ alias ของโฮสต์ เช่น `0.0.0.0` หรือ `127.0.0.1`
</Note>

### Provider ภายในโฮสต์

ภายในคอนเทนเนอร์ `127.0.0.1` หมายถึงตัวคอนเทนเนอร์เอง ไม่ใช่โฮสต์ ให้ใช้ `host.docker.internal` สำหรับ provider ที่ทำงานบนโฮสต์:

| Provider  | URL เริ่มต้นบนโฮสต์         | URL สำหรับตั้งค่า Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

การตั้งค่าที่รวมมาด้วยใช้ URL เหล่านั้นเป็นค่าเริ่มต้นในการเริ่มต้นใช้งาน LM Studio/Ollama และ `docker-compose.yml` จะแมป `host.docker.internal` ไปยัง Gateway ของโฮสต์บน Linux Docker Engine (Docker Desktop มี alias เดียวกันบน macOS/Windows) บริการบนโฮสต์ต้องรับฟังบนที่อยู่ที่ Docker เข้าถึงได้:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

กำลังใช้ไฟล์ Compose ของตนเองหรือ `docker run` อยู่หรือไม่ ให้เพิ่มการแมปเดียวกันด้วยตนเอง เช่น `--add-host=host.docker.internal:host-gateway`

### แบ็กเอนด์ Claude CLI ใน Docker

image อย่างเป็นทางการไม่ได้ติดตั้ง Claude Code ไว้ล่วงหน้า ให้ติดตั้งและเข้าสู่ระบบภายในผู้ใช้ `node` ของคอนเทนเนอร์ จากนั้นทำให้ home ของคอนเทนเนอร์นั้นคงอยู่ เพื่อไม่ให้การอัปเกรด image ลบไบนารีหรือสถานะการยืนยันตัวตน

สำหรับการติดตั้งใหม่ ให้เปิดใช้ volume `/home/node` แบบคงอยู่ก่อนเรียกใช้การตั้งค่า:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

สำหรับการติดตั้งที่มีอยู่ ให้หยุด stack และโหลดค่า `.env` ปัจจุบันอีกครั้งก่อน สคริปต์ตั้งค่าจะเขียน `.env` ใหม่จาก shell และค่าเริ่มต้นปัจจุบันเสมอ โดยจะไม่อ่านไฟล์เอง:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

หาก `.env` มีค่าที่ shell ของคุณไม่สามารถ source ได้ ให้ export ค่าที่ใช้งานด้วยตนเองอีกครั้งก่อน (`OPENCLAW_IMAGE`, พอร์ต, โหมด bind, path แบบกำหนดเอง, `OPENCLAW_EXTRA_MOUNTS`, sandbox, การข้ามการเริ่มต้นใช้งาน) overlay ที่สร้างขึ้นจะ mount home volume ให้ทั้ง `openclaw-gateway` และ `openclaw-cli` ให้เรียกใช้คำสั่งที่เหลือพร้อม overlay นั้น (และ `docker-compose.override.yml` ก่อน หากคุณใช้งาน):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

ตัวติดตั้งแบบเนทีฟจะเขียน `claude` ไปยัง `/home/node/.local/bin/claude` ให้กำหนด OpenClaw ให้ชี้ไปยัง path นั้น:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

เข้าสู่ระบบและตรวจสอบจาก home แบบคงอยู่เดียวกัน:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

จากนั้นใช้แบ็กเอนด์ `claude-cli` ที่รวมมาด้วย:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "กล่าวคำทักทายจาก Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` จะเก็บการติดตั้งแบบเนทีฟไว้ภายใต้ `/home/node/.local/bin` และ `/home/node/.local/share/claude` รวมถึงการตั้งค่า/การยืนยันตัวตนของ Claude Code ภายใต้ `/home/node/.claude` และ `/home/node/.claude.json` การทำให้เฉพาะ `/home/node/.openclaw` คงอยู่นั้นไม่เพียงพอ หากใช้ `OPENCLAW_EXTRA_MOUNTS` แทน home volume ให้ mount path ของ Claude ทั้งหมดเหล่านั้นเข้าในทั้งสองบริการ

<Note>
สำหรับระบบอัตโนมัติใน production ที่ใช้ร่วมกันหรือการเรียกเก็บเงินของ Anthropic ที่คาดการณ์ได้ ให้เลือกใช้เส้นทาง API key ของ Anthropic การใช้ Claude CLI ซ้ำจะเป็นไปตามเวอร์ชันที่ติดตั้ง การเข้าสู่ระบบบัญชี การเรียกเก็บเงิน และพฤติกรรมการอัปเดตของ Claude Code
</Note>

### Bonjour / mDNS

โดยทั่วไปเครือข่าย bridge ของ Docker จะไม่ส่งต่อ multicast ของ Bonjour/mDNS (`224.0.0.251:5353`) อย่างเชื่อถือได้ เมื่อไม่ได้ตั้งค่า `OPENCLAW_DISABLE_BONJOUR` Plugin Bonjour ที่รวมมาด้วยจะปิดการโฆษณาบน LAN โดยอัตโนมัติเมื่อตรวจพบว่ากำลังทำงานในคอนเทนเนอร์ เพื่อไม่ให้เกิด crash loop จากการลอง multicast ซ้ำซึ่ง bridge จะทิ้ง ตั้งค่า `OPENCLAW_DISABLE_BONJOUR=1` เพื่อบังคับปิดโดยไม่คำนึงถึงผลการตรวจจับ หรือ `0` เพื่อบังคับเปิด (เฉพาะบน host networking, macvlan หรือเครือข่ายอื่นที่ทราบว่า multicast ของ mDNS ทำงานได้)

มิฉะนั้น ให้ใช้ URL ของ Gateway ที่เผยแพร่, Tailscale หรือ DNS-SD แบบเครือข่ายบริเวณกว้างสำหรับโฮสต์ Docker ดูข้อควรระวังและการแก้ไขปัญหาใน [การค้นหาด้วย Bonjour](/th/gateway/bonjour)

### พื้นที่จัดเก็บและการคงอยู่

Docker Compose จะ bind-mount `OPENCLAW_CONFIG_DIR` ไปยัง `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` ไปยัง `/home/node/.openclaw/workspace` และ `OPENCLAW_AUTH_PROFILE_SECRET_DIR` ไปยัง `/home/node/.config/openclaw` เพื่อให้ path เหล่านั้นคงอยู่หลังการแทนที่คอนเทนเนอร์ เมื่อตัวแปรไม่ได้ตั้งค่า `docker-compose.yml` จะใช้ค่า fallback ภายใต้ `${HOME}` หรือ `/tmp` หากไม่มี `HOME` เอง เพื่อให้ `docker compose up` ไม่สร้างข้อกำหนด volume ที่มีแหล่งต้นทางว่างเปล่าในสภาพแวดล้อมพื้นฐาน

ไดเรกทอรี config ที่ mount ไว้นั้นประกอบด้วย:

- `openclaw.json` สำหรับ config พฤติกรรม
- `agents/<agentId>/agent/auth-profiles.json` สำหรับการยืนยันตัวตน OAuth/API key ของ provider ที่จัดเก็บไว้
- `.env` สำหรับข้อมูลลับของ runtime ที่อ้างอิงจากสภาพแวดล้อม เช่น `OPENCLAW_GATEWAY_TOKEN`

ไดเรกทอรีข้อมูลลับของโปรไฟล์การยืนยันตัวตนจัดเก็บคีย์เข้ารหัสภายในเครื่องสำหรับข้อมูล token ของโปรไฟล์การยืนยันตัวตนที่ใช้ OAuth ให้เก็บไว้กับสถานะของโฮสต์ Docker แต่แยกจาก `OPENCLAW_CONFIG_DIR`

Plugin แบบดาวน์โหลดที่ติดตั้งไว้จะจัดเก็บสถานะแพ็กเกจภายใต้ home ของ OpenClaw ที่ mount ไว้ ดังนั้นบันทึกการติดตั้งและรูทแพ็กเกจจึงคงอยู่หลังการแทนที่คอนเทนเนอร์ ส่วนการเริ่มต้น Gateway จะไม่สร้าง dependency tree ของ Plugin ที่รวมมาด้วยขึ้นใหม่

สำหรับรายละเอียดทั้งหมดเกี่ยวกับการคงอยู่ของ VM ดู [Docker VM Runtime - สิ่งใดคงอยู่ที่ใด](/th/install/docker-vm-runtime#what-persists-where)

**จุดที่ใช้พื้นที่ดิสก์เพิ่มขึ้นมาก:** `media/`, ฐานข้อมูล SQLite แยกตาม agent, transcript เซสชัน JSONL แบบเก่า, ฐานข้อมูลสถานะ SQLite ที่ใช้ร่วมกัน, รูทแพ็กเกจของ Plugin ที่ติดตั้ง และ log ไฟล์แบบหมุนเวียนภายใต้ `/tmp/openclaw/`

### ตัวช่วย shell (ไม่บังคับ)

สำหรับคำสั่งประจำวันแบบสั้นลง ให้ติดตั้ง [ClawDock](/th/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากคุณติดตั้งจากพาธ `scripts/shell-helpers/clawdock-helpers.sh` แบบเก่า ให้เรียกใช้คำสั่งข้างต้นอีกครั้งเพื่อให้ตัวช่วยในเครื่องติดตามตำแหน่งปัจจุบัน จากนั้นใช้ `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` เป็นต้น (เรียกใช้ `clawdock-help` เพื่อดูรายการทั้งหมด)

<AccordionGroup>
  <Accordion title="เปิดใช้แซนด์บ็อกซ์ของเอเจนต์สำหรับ Docker Gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    พาธซ็อกเก็ตแบบกำหนดเอง (เช่น Docker แบบ rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    สคริปต์จะเมานต์ `docker.sock` หลังจากข้อกำหนดเบื้องต้นของแซนด์บ็อกซ์ผ่านแล้วเท่านั้น หากตั้งค่าแซนด์บ็อกซ์ไม่สำเร็จ สคริปต์จะรีเซ็ต `agents.defaults.sandbox.mode` เป็น `off` โหมดโค้ด Codex จะถูกปิดใช้งานสำหรับเทิร์นที่แซนด์บ็อกซ์ OpenClaw ทำงานอยู่ (ดู [แซนด์บ็อกซ์ § แบ็กเอนด์ Docker](/th/gateway/sandboxing#docker-backend)); ห้ามเมานต์ซ็อกเก็ต Docker ของโฮสต์เข้าในคอนเทนเนอร์แซนด์บ็อกซ์ของเอเจนต์โดยเด็ดขาด

  </Accordion>

  <Accordion title="ระบบอัตโนมัติ / CI (แบบไม่โต้ตอบ)">
    ปิดการจัดสรร pseudo-TTY ของ Compose ด้วย `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="หมายเหตุด้านความปลอดภัยของเครือข่ายที่ใช้ร่วมกัน">
    `openclaw-cli` ใช้ `network_mode: "service:openclaw-gateway"` เพื่อให้คำสั่ง CLI เข้าถึง Gateway ผ่าน `127.0.0.1` ได้ ให้ถือว่านี่เป็นขอบเขตความเชื่อถือร่วมกัน การกำหนดค่า Compose จะตัด `NET_RAW`/`NET_ADMIN` และเปิดใช้ `no-new-privileges` ทั้งบน `openclaw-gateway` และ `openclaw-cli`
  </Accordion>

  <Accordion title="การค้นหา DNS ล้มเหลวใน openclaw-cli บน Docker Desktop">
    การตั้งค่า Docker Desktop บางแบบไม่สามารถค้นหา DNS จากไซด์คาร์ `openclaw-cli` บนเครือข่ายที่ใช้ร่วมกันได้หลังจากตัด `NET_RAW` โดยจะแสดงเป็น `EAI_AGAIN` ระหว่างคำสั่งที่ใช้ npm เช่น `openclaw plugins install` สำหรับการทำงานปกติ ให้ใช้ไฟล์ Compose แบบเสริมความปลอดภัยที่เป็นค่าเริ่มต้นต่อไป โอเวอร์ไรด์ด้านล่างจะคืนค่าความสามารถเริ่มต้นให้เฉพาะคอนเทนเนอร์ `openclaw-cli` เท่านั้น — ใช้สำหรับคำสั่งครั้งเดียวที่จำเป็นต้องเข้าถึงรีจิสทรี ไม่ใช่เป็นวิธีเรียกใช้เริ่มต้น:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    หากสร้างคอนเทนเนอร์ `openclaw-cli` ที่ทำงานระยะยาวไว้แล้ว ให้สร้างใหม่ด้วยโอเวอร์ไรด์เดียวกัน — `docker compose exec`/`docker exec` ไม่สามารถเปลี่ยนความสามารถของ Linux ในคอนเทนเนอร์ที่สร้างแล้วได้

  </Accordion>

  <Accordion title="สิทธิ์และ EACCES">
    อิมเมจทำงานเป็น `node` (uid 1000) หากพบข้อผิดพลาดด้านสิทธิ์ใน `/home/node/.openclaw` ตรวจสอบให้แน่ใจว่า bind mount บนโฮสต์เป็นของ uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    ความไม่ตรงกันแบบเดียวกันอาจแสดงเป็น `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` ตามด้วย `plugin present but blocked` — uid ของโปรเซสและเจ้าของไดเรกทอรี Plugin ที่เมานต์ไม่ตรงกัน ควรทำงานด้วย uid เริ่มต้น 1000 และแก้ไขความเป็นเจ้าของของ bind mount ให้ถูกต้อง เปลี่ยนเจ้าของ `/path/to/openclaw-config/npm` เป็น `root:root` เฉพาะเมื่อจงใจเรียกใช้ OpenClaw เป็น root ในระยะยาวเท่านั้น

  </Accordion>

  <Accordion title="สร้างใหม่ได้เร็วขึ้น">
    จัดลำดับ Dockerfile เพื่อให้เลเยอร์ของการขึ้นต่อกันถูกแคช ซึ่งช่วยหลีกเลี่ยงการเรียกใช้ `pnpm install` ซ้ำ เว้นแต่ lockfile จะเปลี่ยนแปลง:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="ตัวเลือกคอนเทนเนอร์สำหรับผู้ใช้ขั้นสูง">
    อิมเมจเริ่มต้นให้ความสำคัญกับความปลอดภัยและทำงานเป็น `node` ที่ไม่ใช่ root สำหรับคอนเทนเนอร์ที่มีคุณสมบัติครบถ้วนยิ่งขึ้น:

    1. **คงข้อมูล `/home/node` ไว้**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **รวมการขึ้นต่อกันของระบบไว้ในอิมเมจ**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **รวมการขึ้นต่อกันของ Python ไว้ในอิมเมจ**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **รวม Playwright Chromium ไว้ในอิมเมจ**: `export OPENCLAW_INSTALL_BROWSER=1` หรือใช้แท็กอิมเมจ `-browser` อย่างเป็นทางการ
    5. **หรือติดตั้งเบราว์เซอร์ Playwright ลงในวอลุ่มที่คงข้อมูลไว้**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **คงไฟล์ดาวน์โหลดของเบราว์เซอร์ไว้**: ใช้ `OPENCLAW_HOME_VOLUME` หรือ `OPENCLAW_EXTRA_MOUNTS` OpenClaw จะตรวจหา Chromium ที่ Playwright จัดการในอิมเมจบน Linux โดยอัตโนมัติ

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker แบบไม่มีส่วนติดต่อ)">
    หากเลือก OpenAI Codex OAuth ในวิซาร์ด ระบบจะเปิด URL ในเบราว์เซอร์ สำหรับ Docker หรือการตั้งค่าแบบไม่มีส่วนติดต่อ ให้คัดลอก URL เปลี่ยนเส้นทางแบบเต็มที่ปลายทาง แล้ววางกลับลงในวิซาร์ดเพื่อดำเนินการยืนยันตัวตนให้เสร็จสิ้น
  </Accordion>

  <Accordion title="ข้อมูลเมตาของอิมเมจฐาน">
    อิมเมจรันไทม์ใช้ `node:24-bookworm-slim` และเรียกใช้ `tini` เป็น PID 1 เพื่อเก็บกวาดโปรเซสซอมบีและจัดการสัญญาณอย่างถูกต้องในคอนเทนเนอร์ที่ทำงานระยะยาว อิมเมจเผยแพร่คำอธิบายประกอบของอิมเมจฐาน OCI รวมถึง `org.opencontainers.image.base.name` และ `org.opencontainers.image.source` Dependabot จะรีเฟรช digest ของอิมเมจฐาน Node ที่ตรึงไว้ ส่วนบิลด์รุ่นเผยแพร่จะไม่เรียกใช้เลเยอร์อัปเกรดดิสโทรแยกต่างหาก ดู [คำอธิบายประกอบอิมเมจ OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
  </Accordion>
</AccordionGroup>

### กำลังทำงานบน VPS หรือไม่?

ดูขั้นตอนการปรับใช้ VM ที่ใช้ร่วมกัน รวมถึงการรวมไบนารีไว้ในอิมเมจ การคงข้อมูล และการอัปเดต ได้ที่ [Hetzner (Docker VPS)](/th/install/hetzner) และ [รันไทม์ Docker VM](/th/install/docker-vm-runtime)

## แซนด์บ็อกซ์ของเอเจนต์

เมื่อเปิดใช้ `agents.defaults.sandbox` กับแบ็กเอนด์ Docker Gateway จะเรียกใช้เครื่องมือของเอเจนต์ (เชลล์ การอ่าน/เขียนไฟล์ เป็นต้น) ภายในคอนเทนเนอร์ Docker ที่แยกจากกัน ขณะที่ Gateway ยังคงทำงานอยู่บนโฮสต์ — เป็นกำแพงกั้นที่เข้มงวดสำหรับเซสชันเอเจนต์ที่ไม่น่าเชื่อถือหรือมีผู้เช่าหลายราย โดยไม่ต้องบรรจุ Gateway ทั้งหมดไว้ในคอนเทนเนอร์

ขอบเขตแซนด์บ็อกซ์อาจเป็นต่อเอเจนต์ (ค่าเริ่มต้น) ต่อเซสชัน หรือใช้ร่วมกัน โดยแต่ละขอบเขตจะมีพื้นที่ทำงานของตนเองที่เมานต์ไว้ที่ `/workspace` นอกจากนี้ยังสามารถกำหนดค่านโยบายอนุญาต/ปฏิเสธเครื่องมือ การแยกเครือข่าย ขีดจำกัดทรัพยากร และคอนเทนเนอร์เบราว์เซอร์ได้

สำหรับการกำหนดค่า อิมเมจ หมายเหตุด้านความปลอดภัย และโปรไฟล์หลายเอเจนต์ฉบับเต็ม:

- [แซนด์บ็อกซ์](/th/gateway/sandboxing) -- เอกสารอ้างอิงแซนด์บ็อกซ์ฉบับสมบูรณ์
- [OpenShell](/th/gateway/openshell) -- การเข้าถึงเชลล์แบบโต้ตอบสำหรับคอนเทนเนอร์แซนด์บ็อกซ์
- [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) -- การโอเวอร์ไรด์ต่อเอเจนต์

### เปิดใช้อย่างรวดเร็ว

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

สร้างอิมเมจแซนด์บ็อกซ์เริ่มต้น (จากซอร์สที่เช็กเอาต์ไว้):

```bash
scripts/sandbox-setup.sh
```

สำหรับการติดตั้ง npm โดยไม่มีซอร์สที่เช็กเอาต์ไว้ ดูคำสั่ง `docker build` แบบอินไลน์ที่ [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

## การแก้ไขปัญหา

<AccordionGroup>
  <Accordion title="ไม่มีอิมเมจหรือคอนเทนเนอร์แซนด์บ็อกซ์ไม่เริ่มทำงาน">
    สร้างอิมเมจแซนด์บ็อกซ์ด้วย [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (ซอร์สที่เช็กเอาต์ไว้) หรือคำสั่ง `docker build` แบบอินไลน์จาก [แซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) (การติดตั้ง npm) หรือตั้งค่า `agents.defaults.sandbox.docker.image` เป็นอิมเมจที่กำหนดเอง ระบบจะสร้างคอนเทนเนอร์ต่อเซสชันโดยอัตโนมัติตามต้องการ
  </Accordion>

  <Accordion title="ข้อผิดพลาดด้านสิทธิ์ในแซนด์บ็อกซ์">
    ตั้งค่า `docker.user` เป็น UID:GID ที่ตรงกับความเป็นเจ้าของพื้นที่ทำงานที่เมานต์ไว้ หรือเปลี่ยนเจ้าของโฟลเดอร์พื้นที่ทำงาน
  </Accordion>

  <Accordion title="ไม่พบเครื่องมือที่กำหนดเองในแซนด์บ็อกซ์">
    OpenClaw เรียกใช้คำสั่งด้วย `sh -lc` (ล็อกอินเชลล์) ซึ่งจะโหลด `/etc/profile` และอาจรีเซ็ต PATH ตั้งค่า `docker.env.PATH` เพื่อเพิ่มพาธเครื่องมือที่กำหนดเองไว้ด้านหน้า หรือเพิ่มสคริปต์ไว้ใต้ `/etc/profile.d/` ใน Dockerfile
  </Accordion>

  <Accordion title="ถูก OOM kill ระหว่างสร้างอิมเมจ (รหัสออก 137)">
    VM ต้องมี RAM อย่างน้อย 2 GB ใช้คลาสเครื่องที่ใหญ่ขึ้นแล้วลองอีกครั้ง
  </Accordion>

  <Accordion title="ไม่ได้รับอนุญาตหรือต้องจับคู่ใน Control UI">
    ดึงลิงก์แดชบอร์ดใหม่และอนุมัติอุปกรณ์เบราว์เซอร์:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    รายละเอียดเพิ่มเติม: [แดชบอร์ด](/th/web/dashboard), [อุปกรณ์](/th/cli/devices)

  </Accordion>

  <Accordion title="เป้าหมาย Gateway แสดง ws://172.x.x.x หรือเกิดข้อผิดพลาดในการจับคู่จาก Docker CLI">
    รีเซ็ตโหมดและการผูกของ Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install) — วิธีการติดตั้งทั้งหมด
- [Podman](/th/install/podman) — ทางเลือกแทน Docker ด้วย Podman
- [ClawDock](/th/install/clawdock) — การตั้งค่า Docker Compose โดยชุมชน
- [การอัปเดต](/th/install/updating) — การดูแล OpenClaw ให้เป็นเวอร์ชันล่าสุด
- [การกำหนดค่า](/th/gateway/configuration) — การกำหนดค่า Gateway หลังการติดตั้ง
