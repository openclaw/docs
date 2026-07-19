---
read_when:
    - Se desea que un agente de OpenClaw se una a una videoconferencia
    - Está eligiendo entre los plugins de reuniones de Google Meet, Microsoft Teams y Zoom
    - Necesita la configuración compartida de Chrome, BlackHole, SoX o del modo de reunión
summary: Elegir y configurar la participación en reuniones de Google Meet, Microsoft Teams o Zoom
title: Plugins de reuniones
x-i18n:
    generated_at: "2026-07-19T02:15:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ac4357a2ff938f519d4b1112279fe7a7e45d9ae6d679c9eb6d7948fca976b8b
    source_path: plugins/meeting-plugins.md
    workflow: 16
---

OpenClaw tiene plugins independientes para Google Meet, las reuniones de Microsoft Teams y Zoom. Los tres pueden unirse mediante Chrome, utilizar los mismos modos de participación y ejecutar Chrome en el host del Gateway o en un nodo emparejado. Sus URL de plataforma, modelo de instalación y capacidades adicionales son diferentes.

Estos plugins participan en reuniones. Son independientes de los canales de mensajería, como el [canal de Microsoft Teams](/es/channels/msteams), y del [plugin de llamadas de voz](/es/plugins/voice-call).

## Elegir un plugin

| Plataforma      | Plugin                                      | Enlaces de reunión aceptados                                                                                      | Instalación                                    | Vías de participación                                        | Capacidades específicas de la plataforma                                                                                       |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Google Meet     | [`google-meet`](/es/plugins/google-meet)       | `meet.google.com/...`                                                                                       | Instalar desde npm o ClawHub y, después, habilitar | Chrome local, Chrome en un nodo emparejado o conexión telefónica mediante Twilio | Puede crear reuniones mediante la API de Meet o un navegador con sesión iniciada; puede leer artefactos compatibles de Meet con OAuth |
| Microsoft Teams | [`teams-meetings`](/plugins/teams-meetings) | Enlaces de trabajo en `teams.microsoft.com/l/meetup-join/...` y enlaces de consumidores en `teams.live.com/meet/...` | Incluido; habilitarlo                          | Chrome local o Chrome en un nodo emparejado                  | Acceso como invitado a reuniones de trabajo y de consumidores                                                                  |
| Zoom            | [`zoom-meetings`](/plugins/zoom-meetings)   | `zoom.us/j/...` y subdominios de cuenta como `example.zoom.us/j/...`                                      | Incluido; habilitarlo                          | Chrome local o Chrome en un nodo emparejado                  | Acceso como invitado mediante la aplicación web de Zoom                                                                         |

Se debe elegir Google Meet cuando sea necesario crear reuniones, utilizar artefactos de la API de Google o disponer de una vía telefónica mediante Twilio. Se debe elegir Teams o Zoom para la participación directa como invitado desde el navegador en esas plataformas. Los plugins de Teams y Zoom no crean reuniones, no se conectan por teléfono, no llaman a la API del proveedor ni graban reuniones.

## Elegir un modo

Los tres plugins comparten los mismos modos:

| Modo         | Comportamiento                                                                                              | Requisitos de audio                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `agent`      | La transcripción en tiempo real se envía al agente de OpenClaw configurado; la TTS normal de OpenClaw pronuncia la respuesta. | La respuesta de audio mediante Chrome requiere el puente de BlackHole y SoX. |
| `bidi`       | Un modelo de voz en tiempo real escucha y responde directamente.                                            | La respuesta de audio mediante Chrome requiere el puente de BlackHole y SoX. |
| `transcribe` | Se une únicamente para observar y expone una transcripción acotada de subtítulos en directo cuando la plataforma los proporciona. | Sin puente de respuesta de audio de BlackHole ni SoX.    |

Se debe usar `transcribe` cuando el agente solo necesite el texto de la reunión. Se debe usar `agent` para el razonamiento y las herramientas normales de OpenClaw. Se debe usar `bidi` cuando la voz directa de baja latencia sea más importante que dirigir cada turno a través del agente normal.

Las transcripciones de subtítulos son datos de ejecución limitados a la sesión, no grabaciones duraderas de la reunión. La disponibilidad de subtítulos sigue dependiendo de la plataforma de reuniones, la cuenta, el idioma y la política del anfitrión. Consulte la guía de la plataforma para conocer sus límites de transcripción y campos de estado.

## Preparar Chrome y el audio

Chrome puede ejecutarse en el host del Gateway o en un nodo emparejado. Un nodo remoto de Chrome debe permitir `browser.proxy` además del comando de la plataforma:

| Plugin          | Comando del nodo       |
| --------------- | ---------------------- |
| Google Meet     | `googlemeet.chrome`    |
| Microsoft Teams | `teamsmeetings.chrome` |
| Zoom            | `zoommeetings.chrome`  |

Para el modo `agent` o `bidi` mediante Chrome, ejecute Chrome en macOS e instale las dependencias de audio compartidas en ese mismo host:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

El host del Gateway sigue controlando el agente de OpenClaw y las credenciales del modelo cuando Chrome se ejecuta en un nodo emparejado. Configure un proveedor de transcripción en tiempo real y la TTS de OpenClaw para el modo `agent`, o un proveedor de voz en tiempo real para el modo `bidi`. Las guías de las plataformas contienen las opciones del proveedor y de los comandos de audio.

## Habilitar el plugin

Instale Google Meet antes de habilitarlo. Las reuniones de Teams y Zoom se incluyen con OpenClaw y solo deben habilitarse:

```bash
# Solo Google Meet
openclaw plugins install npm:@openclaw/google-meet

# Habilite únicamente los plugins de reuniones que utilice
openclaw plugins enable google-meet
openclaw plugins enable teams-meetings
openclaw plugins enable zoom-meetings
```

Reinicie el Gateway si la vía de administración de plugins no lo reinicia automáticamente. A continuación, ejecute la comprobación de configuración de la plataforma antes de unirse.

## Verificar y unirse

| Plataforma      | Comprobación de configuración | Comando para unirse                                                           |
| --------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| Google Meet     | `openclaw googlemeet setup`    | `openclaw googlemeet join 'https://meet.google.com/abc-defg-hij'`             |
| Microsoft Teams | `openclaw teamsmeetings setup` | `openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'` |
| Zoom            | `openclaw zoommeetings setup`  | `openclaw zoommeetings join 'https://zoom.us/j/1234567890'`                   |

Considere cualquier comprobación de configuración fallida como un impedimento para ese transporte y modo. Para una prueba rápida únicamente de observación, seleccione el modo `transcribe` y confirme que el estado indique una sesión en llamada antes de esperar texto de subtítulos.

## Gestionar las solicitudes de políticas de la plataforma

La automatización del navegador gestiona los controles habituales para el nombre del invitado, la cámara y el micrófono antes de unirse, la entrada, la permanencia en la llamada y la salida. No elude las políticas de la plataforma ni del organizador.

- Google Meet puede requerir iniciar sesión en Google, la admisión del anfitrión o una decisión sobre permisos del navegador.
- Microsoft Teams puede requerir iniciar sesión en el inquilino, verificar el correo electrónico o recibir la admisión del organizador.
- Zoom puede requerir autenticación, verificación del correo electrónico, un código de acceso, completar un CAPTCHA o la admisión del anfitrión; una cuenta también puede deshabilitar el acceso desde el navegador.

Cuando el resultado de una operación de acceso o de estado indique `manualActionRequired`, complete el paso indicado en el mismo perfil de Chrome de OpenClaw antes de volver a intentarlo. Abrir repetidamente pestañas nuevas no resuelve un bloqueo de cuenta, inquilino, sala de espera o CAPTCHA.

Únase únicamente a reuniones en las que el operador esté autorizado para añadir un agente. Informe a los participantes cuando las políticas locales o las normas de consentimiento exijan revelar la participación automatizada, la transcripción o el uso de voz sintetizada.

## Chat de voz de Discord

Los [canales de voz de Discord](/es/channels/discord#voice-channels) proporcionan conversaciones nativas en tiempo real y solo de audio sin automatización de reuniones mediante navegador. OpenClaw puede unirse a un canal de voz, escuchar, dirigir los turnos a través de un agente de OpenClaw o un modelo de voz en tiempo real y pronunciar las respuestas. No envía ni recibe vídeo de cámara ni pantalla compartida, incluso cuando otras personas utilizan vídeo en el mismo canal de Discord, por lo que la voz de Discord es una superficie relacionada de conversación en directo y no un cuarto plugin de reuniones mediante navegador.

## Guías de las plataformas

- [Plugin de Google Meet](/es/plugins/google-meet)
- [Plugin de reuniones de Microsoft Teams](/plugins/teams-meetings)
- [Plugin de reuniones de Zoom](/plugins/zoom-meetings)
- [Administrar plugins](/es/plugins/manage-plugins)
- [Control del navegador](/es/tools/browser)
