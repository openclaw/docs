---
read_when:
    - Trabalhando em caminhos de ativação por voz ou PTT
summary: Modos de ativação por voz e apertar para falar, além de detalhes de roteamento no app para Mac
title: Ativação por voz (macOS)
x-i18n:
    generated_at: "2026-06-27T17:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33c6132d03efb837ae06f4810ff87eb981ad742d793657bc607f4ec214bc2afa
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Ativação por voz e pressione para falar

## Requisitos

A Ativação por voz e o pressione para falar exigem macOS 26 ou mais recente. Em versões mais antigas do macOS,
os controles ficam ocultos na página de configurações de Voz, que mostra o requisito de
macOS 26.

## Modos

- **Modo de palavra de ativação** (padrão): o reconhecedor de fala sempre ativo aguarda tokens de acionamento (`swabbleTriggerWords`). Ao encontrar uma correspondência, ele inicia a captura, mostra a sobreposição com texto parcial e envia automaticamente após o silêncio.
- **Pressione para falar (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente, sem necessidade de acionamento. A sobreposição aparece enquanto a tecla é mantida pressionada; soltar finaliza e encaminha após um breve atraso para que você possa ajustar o texto.

## Comportamento em runtime (palavra de ativação)

- O reconhecedor de fala fica em `VoiceWakeRuntime`.
- O acionamento só dispara quando há uma **pausa significativa** entre a palavra de ativação e a próxima palavra (intervalo de ~0,55 s). A sobreposição/som pode começar na pausa, mesmo antes de o comando começar.
- Janelas de silêncio: 2,0 s quando a fala está fluindo, 5,0 s se apenas o acionamento foi ouvido.
- Parada rígida: 120 s para evitar sessões descontroladas.
- Debounce entre sessões: 350 ms.
- A sobreposição é controlada por `VoiceWakeOverlayController` com coloração confirmada/volátil.
- Após o envio, o reconhecedor reinicia corretamente para escutar o próximo acionamento.

## Invariantes do ciclo de vida

- Se a Ativação por voz estiver habilitada e as permissões tiverem sido concedidas, o reconhecedor de palavra de ativação deve estar escutando (exceto durante uma captura explícita de pressione para falar).
- A visibilidade da sobreposição (incluindo dispensa manual pelo botão X) nunca deve impedir que o reconhecedor retome.

## Modo de falha de sobreposição persistente (anterior)

Anteriormente, se a sobreposição ficasse presa visível e você a fechasse manualmente, a Ativação por voz podia parecer "morta" porque a tentativa de reinício do runtime podia ser bloqueada pela visibilidade da sobreposição, e nenhum reinício subsequente era agendado.

Endurecimento:

- O reinício do runtime de ativação não é mais bloqueado pela visibilidade da sobreposição.
- A conclusão da dispensa da sobreposição aciona um `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, então a dispensa manual pelo X sempre retoma a escuta.

## Especificidades do pressione para falar

- A detecção de tecla de atalho usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos eventos (sem engolir).
- O pipeline de captura fica em `VoicePushToTalk`: inicia a Fala imediatamente, transmite parciais para a sobreposição e chama `VoiceWakeForwarder` ao soltar.
- Quando o pressione para falar começa, pausamos o runtime de palavra de ativação para evitar taps de áudio concorrentes; ele reinicia automaticamente após soltar.
- Permissões: exige Microfone + Fala; ver eventos exige aprovação de Acessibilidade/Monitoramento de entrada.
- Teclados externos: alguns podem não expor o Option direito como esperado; ofereça um atalho alternativo se usuários relatarem falhas.

## Configurações visíveis ao usuário

- Alternância **Ativação por voz**: habilita o runtime de palavra de ativação.
- **Segurar Option direito para falar**: habilita o monitor de pressione para falar.
- Seletores de idioma e microfone, medidor de nível ao vivo, tabela de palavras de acionamento, testador (somente local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo desconectar, mostra uma dica de desconectado e recorre temporariamente ao padrão do sistema até que ele retorne.
- **Sons**: sons ao detectar acionamento e ao enviar; o padrão é o som do sistema macOS "Glass". Você pode escolher qualquer arquivo carregável por `NSSound` (por exemplo, MP3/WAV/AIFF) para cada evento ou escolher **Sem som**.

## Comportamento de encaminhamento

- Quando a Ativação por voz está habilitada, transcrições são encaminhadas para o Gateway/agente ativo (o mesmo modo local vs remoto usado pelo restante do app para Mac).
- Respostas são entregues ao **último provedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro é registrado, e a execução ainda fica visível via WebChat/logs de sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` prefixa a dica da máquina antes de enviar. Compartilhado entre os caminhos de palavra de ativação e pressione para falar.

## Verificação rápida

- Ative o pressione para falar, segure Option direito, fale, solte: a sobreposição deve mostrar parciais e depois enviar.
- Enquanto estiver segurando, as orelhas na barra de menus devem permanecer ampliadas (usa `triggerVoiceEars(ttl:nil)`); elas diminuem após soltar.

## Relacionados

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay)
- [App para macOS](/pt-BR/platforms/macos)
