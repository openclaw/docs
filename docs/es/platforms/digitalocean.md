---
read_when:
    - Configurar OpenClaw en DigitalOcean
    - Buscando alojamiento VPS económico para OpenClaw
summary: OpenClaw en DigitalOcean (opción sencilla de VPS de pago)
title: DigitalOcean (plataforma)
x-i18n:
    generated_at: "2026-04-30T05:50:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw en DigitalOcean

## Objetivo

Ejecutar un OpenClaw Gateway persistente en DigitalOcean por **$6/mes** (o $4/mes con precio reservado).

Si quieres una opción de $0/mes y no te importa ARM + una configuración específica del proveedor, consulta la [guía de Oracle Cloud](/es/install/oracle).

## Comparación de costos (2026)

| Proveedor    | Plan            | Especificaciones        | Precio/mes  | Notas                                      |
| ------------ | --------------- | ----------------------- | ----------- | ------------------------------------------ |
| Oracle Cloud | Always Free ARM | hasta 4 OCPU, 24 GB RAM | $0          | ARM, capacidad limitada / peculiaridades de registro |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM        | €3.79 (~$4) | Opción de pago más barata                  |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM        | $6          | UI sencilla, buena documentación           |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM        | $6          | Muchas ubicaciones                         |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM        | $5          | Ahora parte de Akamai                      |

**Elegir un proveedor:**

- DigitalOcean: UX más sencilla + configuración predecible (esta guía)
- Hetzner: buena relación precio/rendimiento (consulta la [guía de Hetzner](/es/install/hetzner))
- Oracle Cloud: puede costar $0/mes, pero es más delicado y solo ARM (consulta la [guía de Oracle](/es/install/oracle))

---

## Requisitos previos

- Cuenta de DigitalOcean ([regístrate con $200 de crédito gratis](https://m.do.co/c/signup))
- Par de claves SSH (o disposición a usar autenticación con contraseña)
- ~20 minutos

## 1) Crear un Droplet

<Warning>
Usa una imagen base limpia (Ubuntu 24.04 LTS). Evita las imágenes de 1 clic de terceros del Marketplace, salvo que hayas revisado sus scripts de inicio y sus valores predeterminados de firewall.
</Warning>

1. Inicia sesión en [DigitalOcean](https://cloud.digitalocean.com/)
2. Haz clic en **Create → Droplets**
3. Elige:
   - **Región:** La más cercana a ti (o a tus usuarios)
   - **Imagen:** Ubuntu 24.04 LTS
   - **Tamaño:** Basic → Regular → **$6/mes** (1 vCPU, 1 GB RAM, 25 GB SSD)
   - **Autenticación:** Clave SSH (recomendado) o contraseña
4. Haz clic en **Create Droplet**
5. Anota la dirección IP

## 2) Conectarse mediante SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Instalar OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Ejecutar el asistente de configuración inicial

```bash
openclaw onboard --install-daemon
```

El asistente te guiará por:

- Autenticación de modelos (claves API u OAuth)
- Configuración de canales (Telegram, WhatsApp, Discord, etc.)
- Token del Gateway (generado automáticamente)
- Instalación del daemon (systemd)

## 5) Verificar el Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Acceder al panel

El Gateway se enlaza a loopback de forma predeterminada. Para acceder a la UI de control:

**Opción A: túnel SSH (recomendado)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opción B: Tailscale Serve (HTTPS, solo loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Abre: `https://<magicdns>/`

Notas:

- Serve mantiene el Gateway solo en loopback y autentica el tráfico de la UI de control/WebSocket mediante encabezados de identidad de Tailscale (la autenticación sin token presupone un host de Gateway de confianza; las API HTTP no usan esos encabezados de Tailscale y, en su lugar, siguen el modo normal de autenticación HTTP del Gateway).
- Para requerir credenciales explícitas con secreto compartido en su lugar, configura `gateway.auth.allowTailscale: false` y usa `gateway.auth.mode: "token"` o `"password"`.

**Opción C: enlace a Tailnet (sin Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Abre: `http://<tailscale-ip>:18789` (se requiere token).

## 7) Conectar tus canales

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Consulta [Canales](/es/channels) para otros proveedores.

---

## Optimizaciones para 1 GB de RAM

El droplet de $6 solo tiene 1 GB de RAM. Para mantener todo funcionando sin problemas:

### Añadir swap (recomendado)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usar un modelo más ligero

Si estás alcanzando errores OOM, considera:

- Usar modelos basados en API (Claude, GPT) en lugar de modelos locales
- Configurar `agents.defaults.model.primary` con un modelo más pequeño

### Supervisar la memoria

```bash
free -h
htop
```

---

## Persistencia

Todo el estado reside en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canales/proveedores y datos de sesión
- `~/.openclaw/workspace/` — espacio de trabajo (SOUL.md, memoria, etc.)

Esto sobrevive a los reinicios. Haz copias de seguridad periódicamente:

```bash
openclaw backup create
```

---

## Alternativa gratuita de Oracle Cloud

Oracle Cloud ofrece instancias ARM **Always Free** que son significativamente más potentes que cualquier opción de pago aquí, por $0/mes.

| Lo que obtienes        | Especificaciones |
| ---------------------- | ---------------- |
| **4 OCPU**             | ARM Ampere A1    |
| **24 GB RAM**          | Más que suficiente |
| **200 GB de almacenamiento** | Volumen de bloques |
| **Gratis para siempre** | Sin cargos a la tarjeta de crédito |

**Advertencias:**

- El registro puede ser delicado (vuelve a intentarlo si falla)
- Arquitectura ARM: la mayoría de las cosas funcionan, pero algunos binarios necesitan compilaciones ARM

Para la guía de configuración completa, consulta [Oracle Cloud](/es/install/oracle). Para consejos de registro y solución de problemas del proceso de inscripción, consulta esta [guía de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Solución de problemas

### El Gateway no se inicia

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
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Relacionado

- [Guía de Hetzner](/es/install/hetzner) — más barata, más potente
- [Instalación con Docker](/es/install/docker) — configuración en contenedor
- [Tailscale](/es/gateway/tailscale) — acceso remoto seguro
- [Configuración](/es/gateway/configuration) — referencia completa de configuración
