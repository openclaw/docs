---
read_when:
    - Quieres mantener OpenClaw aislado de tu entorno principal de macOS
    - Quieres la integración con iMessage (BlueBubbles) en un entorno aislado
    - Quieres un entorno de macOS restablecible que puedas clonar
    - Quiere comparar opciones de VM de macOS locales frente a alojadas
summary: Ejecuta OpenClaw en una VM de macOS aislada (local o alojada) cuando necesites aislamiento o iMessage
title: Máquinas virtuales de macOS
x-i18n:
    generated_at: "2026-05-06T05:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## Valor predeterminado recomendado (la mayoría de los usuarios)

- **VPS Linux pequeño** para un Gateway siempre activo y de bajo costo. Consulta [alojamiento VPS](/es/vps).
- **Hardware dedicado** (Mac mini o equipo Linux) si quieres control total y una **IP residencial** para automatización del navegador. Muchos sitios bloquean las IP de centros de datos, por lo que la navegación local suele funcionar mejor.
- **Híbrido:** mantén el Gateway en un VPS barato y conecta tu Mac como **Node** cuando necesites automatización de navegador/UI. Consulta [Nodes](/es/nodes) y [Gateway remoto](/es/gateway/remote).

Usa una VM de macOS cuando necesites específicamente capacidades exclusivas de macOS (iMessage/BlueBubbles) o quieras aislamiento estricto respecto a tu Mac diario.

## Opciones de VM de macOS

### VM local en tu Mac Apple Silicon (Lume)

Ejecuta OpenClaw en una VM de macOS aislada en tu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume).

Esto te da:

- Entorno completo de macOS en aislamiento (tu host se mantiene limpio)
- Compatibilidad con iMessage mediante BlueBubbles (imposible en Linux/Windows)
- Restablecimiento instantáneo clonando VMs
- Sin hardware adicional ni costos de nube

### Proveedores de Mac alojados (nube)

Si quieres macOS en la nube, los proveedores de Mac alojados también funcionan:

- [MacStadium](https://www.macstadium.com/) (Macs alojados)
- Otros proveedores de Mac alojados también funcionan; sigue su documentación de VM + SSH

Cuando tengas acceso SSH a una VM de macOS, continúa en el paso 6 más abajo.

---

## Ruta rápida (Lume, usuarios experimentados)

1. Instala Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Completa el Asistente de configuración, activa Inicio de sesión remoto (SSH)
4. `lume run openclaw --no-display`
5. Accede por SSH, instala OpenClaw, configura los canales
6. Listo

---

## Lo que necesitas (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
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

Docs: [Instalación de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Crear la VM de macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Esto descarga macOS y crea la VM. Se abre automáticamente una ventana VNC.

<Note>
La descarga puede tardar un tiempo según tu conexión.
</Note>

---

## 3) Completar el Asistente de configuración

En la ventana VNC:

1. Selecciona el idioma y la región
2. Omite el Apple ID (o inicia sesión si quieres iMessage más adelante)
3. Crea una cuenta de usuario (recuerda el nombre de usuario y la contraseña)
4. Omite todas las funciones opcionales

Cuando termine la configuración, activa SSH:

1. Abre Ajustes del Sistema → General → Compartir
2. Activa "Inicio de sesión remoto"

---

## 4) Obtener la dirección IP de la VM

```bash
lume get openclaw
```

Busca la dirección IP (normalmente `192.168.64.x`).

---

## 5) Acceder a la VM por SSH

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

Esta es la función más potente de ejecutarlo en macOS. Usa [BlueBubbles](https://bluebubbles.app) para añadir iMessage a OpenClaw.

Dentro de la VM:

1. Descarga BlueBubbles desde bluebubbles.app
2. Inicia sesión con tu Apple ID
3. Activa la Web API y establece una contraseña
4. Apunta los webhooks de BlueBubbles a tu gateway (ejemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

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

Reinicia el gateway. Ahora tu agente puede enviar y recibir iMessages.

Detalles completos de configuración: [canal BlueBubbles](/es/channels/bluebubbles)

---

## Guardar una imagen dorada

Antes de personalizar más, crea una instantánea de tu estado limpio:

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

## Ejecución 24/7

Mantén la VM en ejecución:

- Manteniendo tu Mac conectada a la corriente
- Desactivando el reposo en Ajustes del Sistema → Economizador
- Usando `caffeinate` si es necesario

Para una ejecución realmente siempre activa, considera un Mac mini dedicado o un VPS pequeño. Consulta [alojamiento VPS](/es/vps).

---

## Solución de problemas

| Problema                  | Solución                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| No se puede acceder por SSH a la VM | Comprueba que "Inicio de sesión remoto" esté activado en los Ajustes del Sistema de la VM |
| No aparece la IP de la VM | Espera a que la VM arranque por completo y vuelve a ejecutar `lume get openclaw`    |
| No se encuentra el comando Lume | Agrega `~/.local/bin` a tu PATH                                                     |
| El QR de WhatsApp no se escanea | Asegúrate de haber iniciado sesión en la VM (no en el host) al ejecutar `openclaw channels login` |

---

## Documentación relacionada

- [alojamiento VPS](/es/vps)
- [Nodes](/es/nodes)
- [Gateway remoto](/es/gateway/remote)
- [canal BlueBubbles](/es/channels/bluebubbles)
- [Inicio rápido de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referencia de la CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuración de VM desatendida](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzado)
- [Aislamiento con Docker](/es/install/docker) (enfoque de aislamiento alternativo)
