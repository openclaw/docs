---
read_when:
    - Configurar OpenClaw en DigitalOcean
    - Buscar alojamiento VPS barato para OpenClaw
summary: OpenClaw en DigitalOcean (opción sencilla de VPS de pago)
title: DigitalOcean (plataforma)
x-i18n:
    generated_at: "2026-04-24T05:37:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9d286f243f38ed910a3229f195be724f9f96481036380d8c8194ff298d39c87
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw en DigitalOcean

## Objetivo

Ejecutar un Gateway persistente de OpenClaw en DigitalOcean por **$6/mes** (o $4/mes con precios reservados).

Si quieres una opción de $0/mes y no te importa ARM + una configuración específica del proveedor, consulta la [guía de Oracle Cloud](/es/install/oracle).

## Comparación de costos (2026)

| Proveedor    | Plan              | Especificaciones         | Precio/mes    | Notas                                  |
| ------------ | ----------------- | ------------------------ | ------------- | -------------------------------------- |
| Oracle Cloud | Always Free ARM   | hasta 4 OCPU, 24GB RAM   | $0            | ARM, capacidad limitada / peculiaridades en el registro |
| Hetzner      | CX22              | 2 vCPU, 4GB RAM          | €3.79 (~$4)   | Opción de pago más barata              |
| DigitalOcean | Basic             | 1 vCPU, 1GB RAM          | $6            | UI sencilla, buena documentación       |
| Vultr        | Cloud Compute     | 1 vCPU, 1GB RAM          | $6            | Muchas ubicaciones                     |
| Linode       | Nanode            | 1 vCPU, 1GB RAM          | $5            | Ahora forma parte de Akamai            |

**Elegir un proveedor:**

- DigitalOcean: UX más simple + configuración predecible (esta guía)
- Hetzner: buena relación precio/rendimiento (consulta [guía de Hetzner](/es/install/hetzner))
- Oracle Cloud: puede costar $0/mes, pero es más quisquilloso y solo ARM (consulta [guía de Oracle](/es/install/oracle))

---

## Requisitos previos

- Cuenta de DigitalOcean ([registro con $200 de crédito gratis](https://m.do.co/c/signup))
- Par de claves SSH (o disposición para usar autenticación por contraseña)
- ~20 minutos

## 1) Crear un Droplet

<Warning>
Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita imágenes 1-click de terceros del Marketplace a menos que hayas revisado sus scripts de arranque y los valores predeterminados del firewall.
</Warning>

1. Inicia sesión en [DigitalOcean](https://cloud.digitalocean.com/)
2. Haz clic en **Create → Droplets**
3. Elige:
   - **Region:** la más cercana a ti (o a tus usuarios)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mes** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** clave SSH (recomendado) o contraseña
4. Haz clic en **Create Droplet**
5. Anota la dirección IP

## 2) Conectarse por SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instalar OpenClaw

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Instalar OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verificar
openclaw --version
```

## 4) Ejecutar la incorporación

```bash
openclaw onboard --install-daemon
```

El asistente te guiará por:

- Autenticación del modelo (claves API u OAuth)
- Configuración de canales (Telegram, WhatsApp, Discord, etc.)
- Token del Gateway (generado automáticamente)
- Instalación del daemon (systemd)

## 5) Verificar el Gateway

```bash
# Comprobar el estado
openclaw status

# Comprobar el servicio
systemctl --user status openclaw-gateway.service

# Ver los registros
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acceder al panel

El gateway se vincula a loopback de forma predeterminada. Para acceder a la Control UI:

**Opción A: túnel SSH (recomendado)**

```bash
# Desde tu máquina local
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Luego abre: http://localhost:18789
```

**Opción B: Tailscale Serve (HTTPS, solo loopback)**

```bash
# En el droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configurar el Gateway para usar Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Abre: `https://<magicdns>/`

Notas:

- Serve mantiene el Gateway solo en loopback y autentica el tráfico de Control UI/WebSocket mediante encabezados de identidad de Tailscale (la autenticación sin token asume un host Gateway de confianza; las API HTTP no usan esos encabezados de Tailscale y siguen el modo normal de autenticación HTTP del Gateway).
- Para exigir credenciales explícitas con secreto compartido en su lugar, establece `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

**Opción C: bind de tailnet (sin Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Abre: `http://<tailscale-ip>:18789` (requiere token).

## 7) Conectar tus canales

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Escanear código QR
```

Consulta [Canales](/es/channels) para otros proveedores.

---

## Optimizaciones para 1GB de RAM

El droplet de $6 solo tiene 1GB de RAM. Para que todo funcione sin problemas:

### Añadir swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usar un modelo más ligero

Si estás teniendo OOMs, considera:

- Usar modelos basados en API (Claude, GPT) en lugar de modelos locales
- Establecer `agents.defaults.model.primary` en un modelo más pequeño

### Supervisar memoria

```bash
free -h
htop
```

---

## Persistencia

Todo el estado vive en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/proveedor y datos de sesión
- `~/.openclaw/workspace/` — espacio de trabajo (`SOUL.md`, memoria, etc.)

Esto sobrevive a los reinicios. Haz copias de seguridad periódicamente:

```bash
openclaw backup create
```

---

## Alternativa gratuita de Oracle Cloud

Oracle Cloud ofrece instancias ARM **Always Free** que son significativamente más potentes que cualquier opción de pago de esta lista: por $0/mes.

| Lo que obtienes    | Especificaciones        |
| ------------------ | ----------------------- |
| **4 OCPU**         | ARM Ampere A1           |
| **24GB RAM**       | Más que suficiente      |
| **200GB storage**  | Volumen de bloques      |
| **Forever free**   | Sin cargos a la tarjeta |

**Advertencias:**

- El registro puede ser quisquilloso (vuelve a intentarlo si falla)
- Arquitectura ARM: la mayoría de cosas funcionan, pero algunos binarios necesitan compilaciones ARM

Para la guía completa de configuración, consulta [Oracle Cloud](/es/install/oracle). Para consejos de registro y solución de problemas del proceso de alta, consulta esta [guía de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solución de problemas

### El Gateway no arranca

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### El puerto ya está en uso

```bash
lsof -i :18789
kill <PID>
```

### Sin memoria

```bash
# Comprobar memoria
free -h

# Añadir más swap
# O subir al droplet de $12/mes (2GB RAM)
```

---

## Relacionado

- [Guía de Hetzner](/es/install/hetzner) — más barato y más potente
- [Instalación con Docker](/es/install/docker) — configuración en contenedor
- [Tailscale](/es/gateway/tailscale) — acceso remoto seguro
- [Configuración](/es/gateway/configuration) — referencia completa de configuración
