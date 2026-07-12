---
read_when:
    - Quieres aislar OpenClaw de tu entorno principal de macOS
    - Quieres integrar iMessage en un entorno aislado
    - Quieres un entorno macOS restablecible que puedas clonar
    - Quieres comparar opciones de máquinas virtuales macOS locales y alojadas.
summary: Ejecuta OpenClaw en una máquina virtual macOS aislada (local o alojada) cuando necesites aislamiento o iMessage
title: Máquinas virtuales de macOS
x-i18n:
    generated_at: "2026-07-11T23:13:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## Opción predeterminada recomendada (la mayoría de los usuarios)

- **VPS Linux pequeño** para un Gateway siempre activo y de bajo costo. Consulta [Alojamiento en VPS](/es/vps).
- **Hardware dedicado** (Mac mini o equipo Linux) si quieres control total y una **IP residencial** para la automatización del navegador. Muchos sitios bloquean las IP de centros de datos, por lo que la navegación local suele funcionar mejor.
- **Híbrido**: mantén el Gateway en un VPS económico y conecta tu Mac como un **nodo** cuando necesites automatizar el navegador o la interfaz de usuario. Consulta [Nodos](/es/nodes) y [Gateway remoto](/es/gateway/remote).

Usa una máquina virtual de macOS solo cuando necesites específicamente funciones exclusivas de macOS, como iMessage, o quieras un aislamiento estricto respecto a tu Mac de uso diario.

## Opciones de máquinas virtuales de macOS

### Máquina virtual local en tu Mac con Apple Silicon (Lume)

Ejecuta OpenClaw en una máquina virtual de macOS aislada en tu Mac con Apple Silicon mediante [Lume](https://cua.ai/docs/lume). Esto te ofrece:

- Entorno macOS completo y aislado (el sistema anfitrión se mantiene limpio)
- Compatibilidad con iMessage mediante `imsg`; la ruta local predeterminada no es posible en Linux/Windows
- Restablecimiento instantáneo mediante la clonación de máquinas virtuales
- Sin costos adicionales de hardware ni de servicios en la nube

### Proveedores de Mac alojados (nube)

Si quieres usar macOS en la nube, también puedes recurrir a proveedores de Mac alojados:

- [MacStadium](https://www.macstadium.com/) (Mac alojados)
- También funcionan otros proveedores de Mac alojados; sigue su documentación sobre máquinas virtuales y SSH

Cuando tengas acceso SSH a una máquina virtual de macOS, continúa con [Instalar OpenClaw](#6-install-openclaw) más abajo.

## Ruta rápida (Lume, usuarios con experiencia)

1. Instala Lume.
2. `lume create openclaw --os macos --ipsw latest`
3. Completa el Asistente de Configuración y activa Remote Login (SSH).
4. `lume run openclaw --no-display`
5. Accede mediante SSH, instala OpenClaw y configura los canales.
6. Listo.

## Qué necesitas (Lume)

- Mac con Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia o posterior en el sistema anfitrión
- Unos 60 GB de espacio libre en disco por máquina virtual
- Unos 20 minutos

## 1) Instalar Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Si `~/.local/bin` no está en tu PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Verifica la instalación:

```bash
lume --version
```

Documentación: [Instalación de Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) Crear la máquina virtual de macOS

```bash
lume create openclaw --os macos --ipsw latest
```

Este comando descarga macOS y crea la máquina virtual. Se abre automáticamente una ventana de VNC.

<Note>
La descarga puede tardar, según tu conexión.
</Note>

## 3) Completar el Asistente de Configuración

En la ventana de VNC:

1. Selecciona el idioma y la región.
2. Omite el Apple ID (o inicia sesión si quieres usar iMessage más adelante).
3. Crea una cuenta de usuario (recuerda el nombre de usuario y la contraseña).
4. Omite todas las funciones opcionales.

Cuando finalice la configuración:

1. Activa SSH: System Settings -> General -> Sharing y activa "Remote Login".
2. Para usar la máquina virtual sin interfaz gráfica, activa el inicio de sesión automático: System Settings -> Users & Groups, selecciona "Automatically log in as:" y elige el usuario de la máquina virtual.

## 4) Obtener la dirección IP de la máquina virtual

```bash
lume get openclaw
```

Busca la dirección IP (normalmente `192.168.64.x`).

## 5) Conectarse a la máquina virtual mediante SSH

```bash
ssh youruser@192.168.64.X
```

Sustituye `youruser` por la cuenta que creaste y la IP por la dirección IP de tu máquina virtual.

## 6) Instalar OpenClaw

Dentro de la máquina virtual:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Sigue las indicaciones de incorporación para configurar el proveedor de tu modelo (Anthropic, OpenAI, etc.).

## 7) Configurar los canales

Edita el archivo de configuración:

```bash
nano ~/.openclaw/openclaw.json
```

Añade tus canales:

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

A continuación, inicia sesión en WhatsApp (escanea el código QR):

```bash
openclaw channels login
```

## 8) Ejecutar la máquina virtual sin interfaz gráfica

Detén la máquina virtual y reiníciala sin pantalla:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La máquina virtual se ejecuta en segundo plano; el daemon de OpenClaw mantiene el Gateway en ejecución. Para comprobar el estado:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## Adicional: integración con iMessage

Esta es la función estrella de ejecutar OpenClaw en macOS. Usa [iMessage](/es/channels/imessage) con `imsg` para añadir Mensajes a OpenClaw.

Dentro de la máquina virtual:

1. Inicia sesión en Mensajes.
2. Instala `imsg`.
3. Concede acceso completo al disco y permiso de automatización al proceso que ejecuta OpenClaw/`imsg`.
4. Verifica la compatibilidad con RPC mediante `imsg rpc --help`.

Añade lo siguiente a la configuración de OpenClaw:

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

Reinicia el Gateway. Tu agente ya puede enviar y recibir mensajes de iMessage. Detalles completos de configuración: [Canal de iMessage](/es/channels/imessage).

## Guardar una imagen maestra

Antes de seguir personalizando, crea una instantánea del estado limpio:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Restablece el sistema en cualquier momento:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## Ejecución ininterrumpida

Mantén la máquina virtual en ejecución de la siguiente manera:

- Mantén tu Mac conectado a la corriente
- Desactiva la suspensión en System Settings -> Energy Saver
- Usa `caffeinate` si es necesario

Para un funcionamiento realmente ininterrumpido, considera un Mac mini dedicado o un VPS pequeño. Consulta [Alojamiento en VPS](/es/vps).

## Solución de problemas

| Problema                                        | Solución                                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| No es posible conectarse por SSH a la máquina virtual | Comprueba que "Remote Login" esté activado en System Settings dentro de la máquina virtual                                    |
| No aparece la IP de la máquina virtual          | Espera a que la máquina virtual arranque por completo y vuelve a ejecutar `lume get openclaw`                                 |
| No se encuentra el comando Lume                 | Añade `~/.local/bin` a tu PATH                                                                                                |
| No se puede escanear el QR de WhatsApp          | Asegúrate de haber iniciado sesión en la máquina virtual (no en el sistema anfitrión) al ejecutar `openclaw channels login`   |

## Documentación relacionada

- [Alojamiento en VPS](/es/vps)
- [Nodos](/es/nodes)
- [Gateway remoto](/es/gateway/remote)
- [Canal de iMessage](/es/channels/imessage)
- [Inicio rápido de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referencia de la CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuración desatendida de máquinas virtuales](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzado)
- [Aislamiento con Docker](/es/install/docker) (método de aislamiento alternativo)
