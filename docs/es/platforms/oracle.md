---
read_when:
    - Configurar OpenClaw en Oracle Cloud
    - Buscar alojamiento VPS de bajo coste para OpenClaw
    - Quieres OpenClaw 24/7 en un servidor pequeño
summary: OpenClaw en Oracle Cloud (Always Free ARM)
title: Oracle Cloud (plataforma)
x-i18n:
    generated_at: "2026-04-24T05:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18b2e55d330457e18bc94f1e7d7744a3cc3b0c0ce99654a61e9871c21e2c3e35
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw en Oracle Cloud (OCI)

## Objetivo

Ejecutar un Gateway persistente de OpenClaw en el nivel ARM **Always Free** de Oracle Cloud.

El nivel gratuito de Oracle puede encajar muy bien con OpenClaw (especialmente si ya tienes una cuenta de OCI), pero tiene contrapartidas:

- Arquitectura ARM (la mayoría de cosas funcionan, pero algunos binarios pueden ser solo x86)
- La capacidad y el registro pueden ser delicados

## Comparación de costes (2026)

| Proveedor    | Plan            | Especificaciones        | Precio/mes | Notas                 |
| ------------ | --------------- | ---------------------- | ---------- | --------------------- |
| Oracle Cloud | Always Free ARM | hasta 4 OCPU, 24GB RAM | $0         | ARM, capacidad limitada |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4       | Opción de pago más barata |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6         | UI sencilla, buena documentación |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6         | Muchas ubicaciones    |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5         | Ahora forma parte de Akamai |

---

## Requisitos previos

- Cuenta de Oracle Cloud ([registro](https://www.oracle.com/cloud/free/)) — consulta la [guía de registro de la comunidad](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) si tienes problemas
- Cuenta de Tailscale (gratis en [tailscale.com](https://tailscale.com))
- ~30 minutos

## 1) Crear una instancia OCI

1. Inicia sesión en [Oracle Cloud Console](https://cloud.oracle.com/)
2. Ve a **Compute → Instances → Create Instance**
3. Configura:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (o hasta 4)
   - **Memory:** 12 GB (o hasta 24 GB)
   - **Boot volume:** 50 GB (hasta 200 GB gratis)
   - **SSH key:** añade tu clave pública
4. Haz clic en **Create**
5. Toma nota de la dirección IP pública

**Consejo:** Si la creación de la instancia falla con "Out of capacity", prueba con un dominio de disponibilidad diferente o vuelve a intentarlo más tarde. La capacidad del nivel gratuito es limitada.

## 2) Conectarse y actualizar

```bash
# Conectar mediante IP pública
ssh ubuntu@YOUR_PUBLIC_IP

# Actualizar el sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` es necesario para la compilación ARM de algunas dependencias.

## 3) Configurar usuario y nombre de host

```bash
# Establecer el nombre de host
sudo hostnamectl set-hostname openclaw

# Establecer contraseña para el usuario ubuntu
sudo passwd ubuntu

# Habilitar lingering (mantiene los servicios de usuario ejecutándose después de cerrar sesión)
sudo loginctl enable-linger ubuntu
```

## 4) Instalar Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Esto habilita Tailscale SSH, para que puedas conectarte mediante `ssh openclaw` desde cualquier dispositivo de tu tailnet, sin necesidad de IP pública.

Verifica:

```bash
tailscale status
```

**A partir de ahora, conéctate mediante Tailscale:** `ssh ubuntu@openclaw` (o usa la IP de Tailscale).

## 5) Instalar OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Cuando se te pregunte "How do you want to hatch your bot?", selecciona **"Do this later"**.

> Nota: Si te encuentras con problemas de compilación nativa en ARM, empieza por los paquetes del sistema (por ejemplo `sudo apt install -y build-essential`) antes de recurrir a Homebrew.

## 6) Configurar Gateway (loopback + autenticación por token) y habilitar Tailscale Serve

Usa autenticación por token como valor predeterminado. Es predecible y evita necesitar indicadores de “autenticación insegura” en la interfaz de Control.

```bash
# Mantener el Gateway privado en la VM
openclaw config set gateway.bind loopback

# Requerir autenticación para Gateway + interfaz de Control
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Exponer mediante Tailscale Serve (HTTPS + acceso tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` aquí es solo para el manejo del cliente local/IP reenviada del proxy local de Tailscale Serve. **No es** `gateway.auth.mode: "trusted-proxy"`. Las rutas del visor de diff mantienen un comportamiento de fallo seguro en esta configuración: las solicitudes crudas del visor a `127.0.0.1` sin cabeceras de proxy reenviadas pueden devolver `Diff not found`. Usa `mode=file` / `mode=both` para adjuntos, o habilita intencionadamente visores remotos y establece `plugins.entries.diffs.config.viewerBaseUrl` (o pasa un proxy `baseUrl`) si necesitas enlaces compartibles del visor.

## 7) Verificar

```bash
# Comprobar la versión
openclaw --version

# Comprobar el estado del daemon
systemctl --user status openclaw-gateway.service

# Comprobar Tailscale Serve
tailscale serve status

# Probar respuesta local
curl http://localhost:18789
```

## 8) Endurecer la seguridad de la VCN

Ahora que todo funciona, endurece la VCN para bloquear todo el tráfico excepto Tailscale. La Virtual Cloud Network de OCI actúa como un firewall en el borde de la red: el tráfico se bloquea antes de llegar a tu instancia.

1. Ve a **Networking → Virtual Cloud Networks** en OCI Console
2. Haz clic en tu VCN → **Security Lists** → Default Security List
3. **Elimina** todas las reglas de entrada excepto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantén las reglas predeterminadas de salida (permitir todo el tráfico saliente)

Esto bloquea SSH en el puerto 22, HTTP, HTTPS y todo lo demás en el borde de la red. A partir de ahora, solo podrás conectarte mediante Tailscale.

---

## Acceder a la interfaz de Control

Desde cualquier dispositivo de tu red Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Sustituye `<tailnet-name>` por el nombre de tu tailnet (visible en `tailscale status`).

No hace falta túnel SSH. Tailscale proporciona:

- Cifrado HTTPS (certificados automáticos)
- Autenticación mediante identidad de Tailscale
- Acceso desde cualquier dispositivo de tu tailnet (portátil, teléfono, etc.)

---

## Seguridad: VCN + Tailscale (línea base recomendada)

Con la VCN endurecida (solo UDP 41641 abierto) y el Gateway enlazado a loopback, obtienes una fuerte defensa en profundidad: el tráfico público se bloquea en el borde de la red y el acceso administrativo sucede a través de tu tailnet.

Esta configuración a menudo elimina la _necesidad_ de reglas adicionales de firewall basadas en host solo para detener ataques SSH de fuerza bruta desde Internet, pero aun así deberías mantener el SO actualizado, ejecutar `openclaw security audit` y verificar que no estés escuchando accidentalmente en interfaces públicas.

### Ya protegido

| Paso tradicional   | ¿Necesario?  | Por qué                                                                      |
| ------------------ | ------------ | ---------------------------------------------------------------------------- |
| Firewall UFW       | No           | La VCN bloquea antes de que el tráfico llegue a la instancia                 |
| fail2ban           | No           | No hay fuerza bruta si el puerto 22 está bloqueado en la VCN                 |
| Endurecimiento sshd | No          | Tailscale SSH no usa sshd                                                    |
| Desactivar inicio de sesión root | No | Tailscale usa identidad de Tailscale, no usuarios del sistema             |
| Autenticación SSH solo con clave | No | Tailscale autentica mediante tu tailnet                                  |
| Endurecimiento IPv6 | Normalmente no | Depende de la configuración de tu VCN/subred; verifica qué está realmente asignado/expuesto |

### Sigue siendo recomendable

- **Permisos de credenciales:** `chmod 700 ~/.openclaw`
- **Auditoría de seguridad:** `openclaw security audit`
- **Actualizaciones del sistema:** `sudo apt update && sudo apt upgrade` regularmente
- **Supervisar Tailscale:** revisa dispositivos en la [consola de administración de Tailscale](https://login.tailscale.com/admin)

### Verificar la postura de seguridad

```bash
# Confirmar que no hay puertos públicos escuchando
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verificar que Tailscale SSH está activo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Opcional: desactivar sshd por completo
sudo systemctl disable --now ssh
```

---

## Respaldo: túnel SSH

Si Tailscale Serve no funciona, usa un túnel SSH:

```bash
# Desde tu máquina local (mediante Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Luego abre `http://localhost:18789`.

---

## Solución de problemas

### La creación de la instancia falla ("Out of capacity")

Las instancias ARM del nivel gratuito son populares. Prueba:

- Un dominio de disponibilidad diferente
- Reintentar en horas de baja demanda (madrugada)
- Usar el filtro "Always Free" al seleccionar la forma

### Tailscale no se conecta

```bash
# Comprobar estado
sudo tailscale status

# Volver a autenticarse
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway no se inicia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### No se puede acceder a la interfaz de Control

```bash
# Verificar que Tailscale Serve se está ejecutando
tailscale serve status

# Comprobar que el gateway está escuchando
curl http://localhost:18789

# Reiniciar si hace falta
systemctl --user restart openclaw-gateway.service
```

### Problemas con binarios ARM

Puede que algunas herramientas no tengan compilaciones ARM. Comprueba:

```bash
uname -m  # Debe mostrar aarch64
```

La mayoría de los paquetes npm funcionan bien. Para binarios, busca versiones `linux-arm64` o `aarch64`.

---

## Persistencia

Todo el estado vive en:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` por agente, estado de canal/proveedor y datos de sesión
- `~/.openclaw/workspace/` — espacio de trabajo (SOUL.md, memoria, artefactos)

Haz copias de seguridad periódicamente:

```bash
openclaw backup create
```

---

## Relacionado

- [Acceso remoto a Gateway](/es/gateway/remote) — otros patrones de acceso remoto
- [Integración con Tailscale](/es/gateway/tailscale) — documentación completa de Tailscale
- [Configuración de Gateway](/es/gateway/configuration) — todas las opciones de configuración
- [Guía de DigitalOcean](/es/install/digitalocean) — si quieres pago + registro más sencillo
- [Guía de Hetzner](/es/install/hetzner) — alternativa basada en Docker
