---
read_when:
    - Quieres que OpenClaw esté aislado de tu entorno principal de macOS
    - Quieres integración con iMessage en un sandbox
    - Quieres un entorno macOS reiniciable que puedas clonar
    - Quiere comparar las opciones de máquinas virtuales de macOS locales frente a las alojadas
summary: Ejecuta OpenClaw en una VM de macOS en entorno aislado (local o alojada) cuando necesites aislamiento o iMessage
title: VM de macOS
x-i18n:
    generated_at: "2026-06-27T11:48:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## Valor predeterminado recomendado (la mayoría de usuarios)

- **VPS Linux pequeño** para un Gateway siempre activo y de bajo costo. Consulta [alojamiento VPS](/es/vps).
- **Hardware dedicado** (Mac mini o equipo Linux) si quieres control total y una **IP residencial** para automatización del navegador. Muchos sitios bloquean las IP de centros de datos, por lo que la navegación local suele funcionar mejor.
- **Híbrido:** mantén el Gateway en un VPS barato y conecta tu Mac como un **nodo** cuando necesites automatización de navegador/interfaz de usuario. Consulta [Nodos](/es/nodes) y [Gateway remoto](/es/gateway/remote).

Usa una VM de macOS cuando necesites específicamente capacidades exclusivas de macOS, como iMessage, o quieras aislamiento estricto de tu Mac diario.

## Opciones de VM de macOS

### VM local en tu Mac con Apple Silicon (Lume)

Ejecuta OpenClaw en una VM de macOS aislada en tu Mac con Apple Silicon actual usando [Lume](https://cua.ai/docs/lume).

Esto te da:

- Entorno completo de macOS en aislamiento (tu host permanece limpio)
- Compatibilidad con iMessage mediante `imsg` (la ruta local predeterminada es imposible en Linux/Windows)
- Restablecimiento instantáneo clonando VMs
- Sin hardware adicional ni costos de nube

### Proveedores de Mac hospedados (nube)

Si quieres macOS en la nube, los proveedores de Mac hospedados también funcionan:

- [MacStadium](https://www.macstadium.com/) (Macs hospedados)
- Otros proveedores de Mac hospedados también funcionan; sigue su documentación de VM + SSH

Cuando tengas acceso SSH a una VM de macOS, continúa en el paso 6 a continuación.

---

## Ruta rápida (Lume, usuarios con experiencia)

1. Instala Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Completa el Asistente de configuración, habilita Inicio de sesión remoto (SSH)
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

1. Selecciona idioma y región
2. Omite Apple ID (o inicia sesión si quieres iMessage más adelante)
3. Crea una cuenta de usuario (recuerda el nombre de usuario y la contraseña)
4. Omite todas las funciones opcionales

Después de completar la configuración:

1. Habilita SSH: abre Configuración del Sistema -> General -> Compartir y habilita "Inicio de sesión remoto".
2. Para usar la VM sin pantalla, habilita el inicio de sesión automático: abre Configuración del Sistema -> Usuarios y grupos, selecciona "Iniciar sesión automáticamente como:" y elige el usuario de la VM.

---

## 4) Obtener la dirección IP de la VM

```bash
lume get openclaw
```

Busca la dirección IP (normalmente `192.168.64.x`).

---

## 5) Conectarse por SSH a la VM

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

Sigue las indicaciones de incorporación para configurar tu proveedor de modelo (Anthropic, OpenAI, etc.).

---

## 7) Configurar canales

Edita el archivo de configuración:

```bash
nano ~/.openclaw/openclaw.json
```

Añade tus canales:

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

## 8) Ejecutar la VM sin pantalla

Detén la VM y reiníciala sin pantalla:

```bash
lume stop openclaw
lume run openclaw --no-display
```

La VM se ejecuta en segundo plano. El daemon de OpenClaw mantiene el gateway en ejecución.

Para comprobar el estado:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Extra: integración con iMessage

Esta es la función estrella de ejecutarlo en macOS. Usa [iMessage](/es/channels/imessage) con `imsg` para añadir Mensajes a OpenClaw.

Dentro de la VM:

1. Inicia sesión en Mensajes.
2. Instala `imsg`.
3. Concede Acceso total al disco y permiso de Automatización al proceso que ejecuta OpenClaw/`imsg`.
4. Verifica la compatibilidad con RPC mediante `imsg rpc --help`.

Añade esto a tu configuración de OpenClaw:

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

Reinicia el gateway. Ahora tu agente puede enviar y recibir iMessages.

Detalles completos de configuración: [canal de iMessage](/es/channels/imessage)

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

## Ejecución 24/7

Mantén la VM en ejecución:

- Manteniendo tu Mac conectado a la corriente
- Desactivando la suspensión en Configuración del Sistema → Economizador de energía
- Usando `caffeinate` si es necesario

Para una disponibilidad verdaderamente permanente, considera un Mac mini dedicado o un VPS pequeño. Consulta [alojamiento VPS](/es/vps).

---

## Solución de problemas

| Problema                 | Solución                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| No se puede entrar por SSH a la VM | Comprueba que "Inicio de sesión remoto" esté habilitado en Configuración del Sistema de la VM |
| No aparece la IP de la VM | Espera a que la VM arranque por completo y vuelve a ejecutar `lume get openclaw`   |
| No se encuentra el comando Lume | Añade `~/.local/bin` a tu PATH                                                    |
| El QR de WhatsApp no se escanea | Asegúrate de haber iniciado sesión en la VM (no en el host) al ejecutar `openclaw channels login` |

---

## Documentación relacionada

- [alojamiento VPS](/es/vps)
- [Nodos](/es/nodes)
- [Gateway remoto](/es/gateway/remote)
- [canal de iMessage](/es/channels/imessage)
- [Inicio rápido de Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Referencia de CLI de Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Configuración de VM desatendida](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (avanzado)
- [Aislamiento con Docker](/es/install/docker) (enfoque de aislamiento alternativo)
