---
read_when:
    - Trabalhando em fluxos de ativação por voz ou PTT
summary: Modos de ativação por voz e pressione para falar, além de detalhes de roteamento no app para Mac
title: Ativação por voz (macOS)
x-i18n:
    generated_at: "2026-07-12T15:25:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Ativação por voz e pressione para falar

## Requisitos

A Ativação por voz e o recurso de pressionar para falar exigem o macOS 26 ou mais recente. Em versões anteriores do macOS, os controles ficam ocultos na página de configurações de Voz, que exibe o requisito do macOS 26.

## Modos

- **Modo de palavra de ativação** (padrão): um reconhecedor de Fala sempre ativo aguarda tokens de ativação (`swabbleTriggerWords`). Quando há uma correspondência, ele inicia a captura, exibe a sobreposição com o texto parcial e envia automaticamente após um período de silêncio.
- **Pressione para falar (mantenha pressionada a tecla Option direita)**: mantenha pressionada a tecla Option direita para iniciar a captura imediatamente, sem precisar de um termo de ativação. A sobreposição é exibida enquanto a tecla permanece pressionada; ao soltá-la, a captura é finalizada e encaminhada após um breve atraso, para que você possa editar o texto.

## Comportamento em tempo de execução (palavra de ativação)

- O reconhecedor reside em `VoiceWakeRuntime`.
- A ativação ocorre somente quando há uma pausa perceptível entre a palavra de ativação e a palavra seguinte (`triggerPauseWindow` = 0.55s). A sobreposição/o aviso sonoro podem ser iniciados durante a pausa, antes mesmo do início do comando.
- Janelas de silêncio: 2.0s (`silenceWindow`) enquanto a fala está em andamento, 5.0s (`triggerOnlySilenceWindow`) se apenas o termo de ativação tiver sido ouvido.
- Interrupção forçada: 120s (`captureHardStop`) para evitar sessões descontroladas.
- Debounce entre sessões: 350ms (`debounceAfterSend`) após um envio.
- A sobreposição é controlada por `VoiceWakeOverlayController`, com cores distintas para texto confirmado/volátil.
- Após o envio, o reconhecedor é reiniciado de forma limpa para aguardar a próxima ativação.

## Invariantes do ciclo de vida

- Se a Ativação por voz estiver habilitada e as permissões tiverem sido concedidas, o reconhecedor de palavra de ativação continuará escutando, exceto durante uma captura ativa de pressionar para falar.
- O fechamento da sobreposição, inclusive o fechamento manual pelo botão X, sempre retoma o reconhecedor: `VoiceSessionCoordinator.overlayDidDismiss` chama `VoiceWakeRuntime.refresh(state:)` em todos os caminhos de fechamento. Consulte [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay) para ver o modelo de sessão/token.

## Detalhes do recurso de pressionar para falar

- A detecção da tecla de atalho usa um monitor global `.flagsChanged` para a tecla Option direita (`keyCode 61` + `.option`). Ele apenas observa os eventos, sem nunca interceptá-los.
- A captura reside em `VoicePushToTalk`: inicia o reconhecimento de Fala imediatamente, transmite resultados parciais para a sobreposição e chama `VoiceWakeForwarder` quando a tecla é solta.
- O início do recurso de pressionar para falar pausa o runtime de palavra de ativação para evitar capturas de áudio concorrentes; ele é reiniciado automaticamente após a tecla ser solta.
- Permissões: requer Microfone + Reconhecimento de Fala; o recebimento de eventos de teclado exige aprovação de Acessibilidade/Monitoramento de Entrada.
- Teclados externos: alguns não expõem a tecla Option direita conforme esperado. Ofereça um atalho alternativo caso os usuários relatem falhas de detecção.

## Configurações visíveis ao usuário

- Alternância **Ativação por voz**: habilita o runtime de palavra de ativação.
- **Mantenha pressionada a tecla Option direita para falar**: habilita o monitor do recurso de pressionar para falar.
- Seletores de idioma e microfone, um medidor de nível em tempo real, uma tabela de palavras de ativação e uma ferramenta de teste (somente local, nunca encaminha).
- O seletor de microfone preserva a última seleção caso um dispositivo seja desconectado, exibe um aviso de desconexão e usa temporariamente o padrão do sistema até que o dispositivo retorne.
- **Sons**: avisos sonoros ao detectar a ativação e ao enviar, usando por padrão o som de sistema "Glass" do macOS. Selecione qualquer arquivo compatível com `NSSound` (por exemplo, MP3/WAV/AIFF) para cada evento ou escolha **Sem som**.

## Comportamento de encaminhamento

- Durante o encaminhamento, `VoiceWakeForwarder.selectedSessionOptions` seleciona a chave da sessão ativa do WebChat, se houver uma definida; caso contrário, usa a chave da sessão principal do Gateway.
- Ele procura essa sessão por meio de `sessions.list` e obtém o canal e o destino de entrega do contexto de entrega da sessão (recorrendo ao último canal/destino e, em seguida, a uma chave de sessão analisada), usando o WebChat como padrão se nada for resolvido.
- Se a entrega falhar, o erro será registrado (categoria `voicewake.forward`) e a execução continuará visível pelos logs do WebChat/da sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona uma linha de dica para a máquina (nome do host resolvido, recorrendo a "este Mac") antes da transcrição, compartilhada entre os caminhos de palavra de ativação e de pressionar para falar.

## Verificação rápida

- Ative o recurso de pressionar para falar, mantenha pressionada a tecla Option direita, fale e solte-a: a sobreposição deverá exibir resultados parciais e depois enviar.
- Enquanto a tecla estiver pressionada, as orelhas na barra de menus deverão permanecer ampliadas (`triggerVoiceEars(ttl: nil)`); elas diminuem após a tecla ser solta.

## Relacionados

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
