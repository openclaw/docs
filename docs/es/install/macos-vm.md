---
read_when:
    - Quieres mantener OpenClaw aislado de tu entorno principal de macOS
    - Quieres la integración con iMessage (BlueBubbles) en un entorno aislado
    - Quieres un entorno macOS restablecible que puedas clonar
    - Quieres comparar opciones de VM de macOS locales frente a alojadas
summary: Ejecuta OpenClaw en una VM de macOS aislada (local o alojada) cuando necesites aislamiento o iMessage
title: Máquinas virtuales de macOS
x-i18n:
    generated_at: "2026-04-30T05:48:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# OpenClaw en VM de macOS (aislamiento)

## Valor predeterminado recomendado (la mayoría de los usuarios)

- **VPS Linux pequeño** para un Gateway siempre activo y de bajo costo. Consulta [alojamiento VPS](/es/vps).
- **Hardware dedicado** (Mac mini o equipo Linux) si quieres control total y una **IP residencial** para automatización de navegador. Muchos sitios bloquean las IP de centros de datos, por lo que la navegación local suele funcionar mejor.
- **Híbrido:** mantén el Gateway en un VPS económico y conecta tu Mac como un **Node** cuando necesites automatización de navegador/UI. Consulta [Nodes](/es/nodes) y [Gateway remoto](/es/gateway/remote).

Usa una VM de macOS cuando necesites específicamente capacidades exclusivas de macOS (iMessage/BlueBubbles) o quieras aislamiento estricto respecto a tu Mac de uso diario.

## Opciones de VM de macOS

### VM local en tu Mac con Apple Silicon (Lume)

Ejecuta OpenClaw en una VM de macOS aislada en tu Mac con Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Esto te ofrece:

- Entorno macOS completo en aislamiento (tu host se mantiene limpio)
- Compatibilidad con iMessage mediante BlueBubbles (imposible en Linux/Windows)
- Restablecimiento instantáneo clonando VM
- Sin hardware adicional ni costos de nube

### Proveedores de Mac hospedados (nube)

Si quieres macOS en la nube, los proveedores de Mac hospedados también funcionan:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Otros proveedores de Mac hospedados también funcionan; sigue su documentación de VM + SSH

Cuando tengas acceso SSH a una VM de macOS, continúa en el paso 6 a continuación.

---

## Ruta rápida (Lume, usuarios experimentados)

1. Instala Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Completa el Asistente de configuración, habilita Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Entra por SSH, instala OpenClaw, configura canales
6. Listo

---

## Lo que necesitas (Lume)

- Mac con Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia o posterior en el host
- ~60 GB de espacio libre en disco por VM
- ~20 minutos

---

## 1) Instalar Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Si `~/.local/bin` no está en tu PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifica:

```bash
lume --version
```

Documentación: [Instalación de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Crear la VM de macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Esto descarga macOS y crea la VM. Se abre automáticamente una ventana VNC.

<Note>
La descarga puede tardar un poco según tu conexión.
</Note>

---

## 3) Completar el Asistente de configuración

En la ventana VNC:

1. Selecciona idioma y región
2. Omite el Apple ID (o inicia sesión si quieres usar iMessage más adelante)
3. Crea una cuenta de usuario (recuerda el nombre de usuario y la contraseña)
4. Omite todas las funciones opcionales

Después de completar la configuración, habilita SSH:

1. Abre System Settings → General → Sharing
2. Habilita "Remote Login"

---

## 4) Obtener la dirección IP de la VM

```bash
lume get openclaw
```

Busca la dirección IP (normalmente `192.168.64.x`).

---

## 5) Conectarse a la VM por SSH

```bash
ssh youruser@192.168.64.X
```

Reemplaza `youruser` por la cuenta que creaste y la IP por la IP de tu VM.

---

## 6) Instalar OpenClaw

Dentro de la VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Sigue las indicaciones de incorporación para configurar tu proveedor de modelos (Anthropic, OpenAI, etc.).

---

## 7) Configurar canales

Edita el archivo de configuración:

```bash
nano ~/.openclaw/openclaw.json
```

Agrega tus canales:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Luego inicia sesión en WhatsApp (escanea el QR):

```bash
openclaw channels login
```

---

## 8) Ejecutar la VM sin interfaz gráfica

Detén la VM y reiníciala sin pantalla:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM se ejecuta en segundo plano. El daemon de OpenClaw mantiene el Gateway en ejecución.

Para comprobar el estado:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Extra: integración con iMessage

Esta es la función más potente de ejecutar en macOS. Usa [BlueBubbles](https://bluebubbles.app) para agregar iMessage a OpenClaw.

Dentro de la VM:

1. Descarga BlueBubbles desde bluebubbles.app
2. Inicia sesión con tu Apple ID
3. Habilita la Web API y establece una contraseña
4. Apunta los Webhooks de BlueBubbles a tu Gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Agrega esto a tu configuración de OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Reinicia el Gateway. Ahora tu agente puede enviar y recibir iMessages.

Detalles completos de configuración: [canal de BlueBubbles](/es/channels/bluebubbles)

---

## Guardar una imagen dorada

Antes de personalizar más, toma una instantánea de tu estado limpio:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Restablece en cualquier momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Ejecutar 24/7

Mantén la VM en ejecución de estas formas:

- Mantén tu Mac enchufada
- Deshabilita el reposo en System Settings → Energy Saver
- Usa `caffeinate` si es necesario

Para una disponibilidad realmente continua, considera un Mac mini dedicado o un VPS pequeño. Consulta [alojamiento VPS](/es/vps).

---

## Solución de problemas

| Problema                 | Solución                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| No se puede hacer SSH a la VM | Comprueba que "Remote Login" esté habilitado en System Settings de la VM                     |
| La IP de la VM no aparece | Espera a que la VM arranque por completo y ejecuta `lume get openclaw` de nuevo                  |
| Comando Lume no encontrado | Agrega `~/.local/bin` a tu PATH                                                                |
| El QR de WhatsApp no se escanea | Asegúrate de haber iniciado sesión en la VM (no en el host) al ejecutar `openclaw channels login` |

---

## Documentación relacionada

- [Alojamiento VPS](/es/vps)
- [Nodes](/es/nodes)
- [Gateway remoto](/es/gateway/remote)
- [Canal de BlueBubbles](/es/channels/bluebubbles)
- [Inicio rápido de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referencia de la CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuración de VM desatendida](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzado)
- [Aislamiento con Docker](/es/install/docker) (enfoque de aislamiento alternativo)
