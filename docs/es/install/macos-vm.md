---
read_when:
    - Quieres aislar OpenClaw de tu entorno principal de macOS
    - Quieres integración con iMessage en un sandbox
    - Quieres un entorno macOS restablecible que puedas clonar
    - Quieres comparar opciones de VM de macOS locales frente a alojadas
summary: Ejecuta OpenClaw en una VM de macOS aislada (local o alojada) cuando necesites aislamiento o iMessage
title: VMs de macOS
x-i18n:
    generated_at: "2026-07-05T11:29:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Opción predeterminada recomendada (la mayoría de los usuarios)

- **VPS Linux pequeño** para un Gateway siempre activo y de bajo costo. Consulta [alojamiento VPS](/es/vps).
- **Hardware dedicado** (Mac mini o equipo Linux) si quieres control total y una **IP residencial** para automatización de navegador. Muchos sitios bloquean IP de centros de datos, por lo que la navegación local suele funcionar mejor.
- **Híbrido**: mantén el Gateway en un VPS económico y conecta tu Mac como **Node** cuando necesites automatización de navegador/UI. Consulta [Nodes](/es/nodes) y [Gateway remoto](/es/gateway/remote).

Usa una VM de macOS solo cuando necesites específicamente capacidades exclusivas de macOS, como iMessage, o quieras aislamiento estricto respecto de tu Mac diario.

## Opciones de VM de macOS

### VM local en tu Mac Apple Silicon (Lume)

Ejecuta OpenClaw en una VM de macOS aislada en tu Mac Apple Silicon existente usando [Lume](https://cua.ai/docs/lume). Esto te da:

- Entorno macOS completo en aislamiento (tu host permanece limpio)
- Compatibilidad con iMessage mediante `imsg`; la ruta local predeterminada es imposible en Linux/Windows
- Restablecimiento instantáneo clonando VM
- Sin hardware adicional ni costos de nube

### Proveedores de Mac alojados (nube)

Si quieres macOS en la nube, los proveedores de Mac alojados también funcionan:

- [MacStadium](https://www.macstadium.com/) (Mac alojados)
- Otros proveedores de Mac alojados también funcionan; sigue su documentación de VM + SSH

Una vez que tengas acceso SSH a una VM de macOS, continúa con [Instalar OpenClaw](#6-install-openclaw) más abajo.

## Ruta rápida (Lume, usuarios con experiencia)

1. Instala Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Completa el Asistente de configuración, habilita Inicio de sesión remoto (SSH).
4. `lume run openclaw --no-display`
5. Entra por SSH, instala OpenClaw, configura canales.
6. Listo.

## Lo que necesitas (Lume)

- Mac Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia o posterior en el host
- ~60 GB de espacio libre en disco por VM
- ~20 minutos

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

## 2) Crear la VM de macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Esto descarga macOS y crea la VM. Se abre automáticamente una ventana VNC.

<Note>
La descarga puede tardar un tiempo según tu conexión.
</Note>

## 3) Completar el Asistente de configuración

En la ventana VNC:

1. Selecciona idioma y región.
2. Omite el Apple ID (o inicia sesión si quieres iMessage más adelante).
3. Crea una cuenta de usuario (recuerda el nombre de usuario y la contraseña).
4. Omite todas las funciones opcionales.

Después de completar la configuración:

1. Habilita SSH: System Settings -> General -> Sharing, habilita "Remote Login".
2. Para usar la VM sin interfaz, habilita el inicio de sesión automático: System Settings -> Users & Groups, selecciona "Automatically log in as:" y elige el usuario de la VM.

## 4) Obtener la dirección IP de la VM

```bash
lume get openclaw
```

Busca la dirección IP (normalmente `192.168.64.x`).

## 5) Entrar por SSH a la VM

```bash
ssh youruser@192.168.64.X
```

Reemplaza `youruser` por la cuenta que creaste, y la IP por la IP de tu VM.

## 6) Instalar OpenClaw

Dentro de la VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Sigue las indicaciones de incorporación para configurar tu proveedor de modelos (Anthropic, OpenAI, etc.).

## 7) Configurar canales

Edita el archivo de configuración:

```bash
nano ~/.openclaw/openclaw.json
```

Agrega tus canales:

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

Luego inicia sesión en WhatsApp (escanea el QR):

```bash
openclaw channels login
```

## 8) Ejecutar la VM sin interfaz

Detén la VM y reiníciala sin pantalla:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM se ejecuta en segundo plano; el daemon de OpenClaw mantiene el Gateway en ejecución. Para comprobar el estado:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Extra: integración con iMessage

Esta es la función estrella de ejecutar en macOS. Usa [iMessage](/es/channels/imessage) con `imsg` para agregar Messages a OpenClaw.

Dentro de la VM:

1. Inicia sesión en Messages.
2. Instala `imsg`.
3. Concede permiso de Full Disk Access y Automation al proceso que ejecuta OpenClaw/`imsg`.
4. Verifica la compatibilidad con RPC usando `imsg rpc --help`.

Agrega esto a tu configuración de OpenClaw:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Reinicia el Gateway. Tu agente ahora puede enviar y recibir iMessages. Detalles completos de configuración: [canal de iMessage](/es/channels/imessage).

## Guardar una imagen maestra

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

## Ejecución 24/7

Mantén la VM en ejecución así:

- Manteniendo tu Mac conectado a la corriente
- Deshabilitando el reposo en System Settings -> Energy Saver
- Usando `caffeinate` si es necesario

Para un verdadero funcionamiento siempre activo, considera un Mac mini dedicado o un VPS pequeño. Consulta [alojamiento VPS](/es/vps).

## Solución de problemas

| Problema                 | Solución                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| No se puede entrar por SSH a la VM | Comprueba que "Remote Login" esté habilitado en System Settings de la VM |
| La IP de la VM no aparece | Espera a que la VM arranque por completo y ejecuta `lume get openclaw` de nuevo    |
| No se encuentra el comando Lume | Agrega `~/.local/bin` a tu PATH                                                |
| El QR de WhatsApp no escanea | Asegúrate de haber iniciado sesión en la VM (no en el host) al ejecutar `openclaw channels login` |

## Documentación relacionada

- [Alojamiento VPS](/es/vps)
- [Nodes](/es/nodes)
- [Gateway remoto](/es/gateway/remote)
- [Canal de iMessage](/es/channels/imessage)
- [Inicio rápido de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referencia de CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuración de VM desatendida](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzado)
- [Aislamiento con Docker](/es/install/docker) (enfoque de aislamiento alternativo)
