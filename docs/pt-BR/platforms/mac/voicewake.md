---
read_when:
    - Trabalhar em caminhos de ativação por voz ou PTT
summary: Modos de ativação por voz e push-to-talk, além de detalhes de roteamento no app macOS
title: Ativação por voz (macOS)
x-i18n:
    generated_at: "2026-04-24T06:01:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0273c24764f0baf440a19f31435d6ee62ab040c1ec5a97d7733d3ec8b81b0641
    source_path: platforms/mac/voicewake.md
    workflow: 15
---

# Ativação por voz e Push-to-Talk

## Modos

- **Modo de palavra de ativação** (padrão): o reconhecedor de fala sempre ativo aguarda tokens de disparo (`swabbleTriggerWords`). Ao detectar uma correspondência, ele inicia a captura, mostra a sobreposição com texto parcial e envia automaticamente após silêncio.
- **Push-to-talk (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente — sem precisar de gatilho. A sobreposição aparece enquanto a tecla estiver pressionada; ao soltar, a captura é finalizada e encaminhada após um curto atraso para que você possa ajustar o texto.

## Comportamento em runtime (palavra de ativação)

- O reconhecedor de fala fica em `VoiceWakeRuntime`.
- O gatilho só dispara quando há uma **pausa significativa** entre a palavra de ativação e a próxima palavra (intervalo de ~0,55s). A sobreposição/toque pode começar nessa pausa, mesmo antes de o comando começar.
- Janelas de silêncio: 2,0s quando a fala está fluindo, 5,0s se apenas o gatilho tiver sido ouvido.
- Parada forçada: 120s para evitar sessões descontroladas.
- Debounce entre sessões: 350ms.
- A sobreposição é controlada por `VoiceWakeOverlayController` com coloração de texto confirmado/volátil.
- Após o envio, o reconhecedor reinicia corretamente para ouvir o próximo gatilho.

## Invariantes de ciclo de vida

- Se a ativação por voz estiver ativada e as permissões tiverem sido concedidas, o reconhecedor de palavra de ativação deve estar ouvindo (exceto durante uma captura explícita por push-to-talk).
- A visibilidade da sobreposição (incluindo fechamento manual pelo botão X) nunca deve impedir que o reconhecedor volte a funcionar.

## Modo de falha de sobreposição travada (anterior)

Antes, se a sobreposição ficasse visível travada e você a fechasse manualmente, a ativação por voz podia parecer “morta” porque a tentativa de reinicialização do runtime podia ser bloqueada pela visibilidade da sobreposição e nenhuma reinicialização posterior era agendada.

Reforço:

- A reinicialização do runtime de ativação por voz não é mais bloqueada pela visibilidade da sobreposição.
- A conclusão do fechamento da sobreposição aciona `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, então o fechamento manual pelo X sempre retoma a escuta.

## Especificidades de push-to-talk

- A detecção de hotkey usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos eventos (sem interceptá-los).
- O pipeline de captura fica em `VoicePushToTalk`: inicia Speech imediatamente, transmite parciais para a sobreposição e chama `VoiceWakeForwarder` ao soltar.
- Quando o push-to-talk começa, pausamos o runtime de palavra de ativação para evitar taps de áudio concorrentes; ele reinicia automaticamente após soltar.
- Permissões: exige Microfone + Speech; para enxergar eventos, é necessária aprovação de Accessibility/Input Monitoring.
- Teclados externos: alguns podem não expor o Option direito como esperado — ofereça um atalho alternativo se usuários relatarem falhas.

## Configurações voltadas ao usuário

- Alternância **Voice Wake**: ativa o runtime de palavra de ativação.
- **Segure Cmd+Fn para falar**: ativa o monitor de push-to-talk. Desativado no macOS < 26.
- Seletores de idioma e microfone, medidor de nível ao vivo, tabela de palavras de ativação, testador (apenas local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo for desconectado, mostra uma dica de desconexão e recorre temporariamente ao padrão do sistema até que ele retorne.
- **Sons**: toques ao detectar gatilho e ao enviar; por padrão usa o som do sistema macOS “Glass”. Você pode escolher qualquer arquivo carregável por `NSSound` (por exemplo MP3/WAV/AIFF) para cada evento ou escolher **No Sound**.

## Comportamento de encaminhamento

- Quando a ativação por voz está ativada, as transcrições são encaminhadas para o gateway/agente ativo (o mesmo modo local vs remoto usado pelo restante do app macOS).
- As respostas são entregues ao **último provider principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro é registrado em log e a execução ainda fica visível via WebChat/logs de sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona a dica da máquina antes do envio. Compartilhado entre os caminhos de palavra de ativação e push-to-talk.

## Verificação rápida

- Ative o push-to-talk, segure Cmd+Fn, fale, solte: a sobreposição deve mostrar parciais e depois enviar.
- Enquanto estiver segurando, as “orelhas” da barra de menus devem permanecer ampliadas (usa `triggerVoiceEars(ttl:nil)`); elas diminuem após soltar.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay)
- [App macOS](/pt-BR/platforms/macos)
