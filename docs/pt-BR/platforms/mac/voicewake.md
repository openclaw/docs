---
read_when:
    - Trabalhando em fluxos de ativação por voz ou PTT
summary: Modos de ativação por voz e pressione para falar, além de detalhes de roteamento no app para Mac
title: Ativação por voz (macOS)
x-i18n:
    generated_at: "2026-07-12T00:04:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a0a5ac44931b578daa4f74b3728a65a1c19ab9742e2d4b9f4c6db49fa5d7b8a
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Ativação por voz e pressione para falar

## Requisitos

A ativação por voz e o recurso de pressionar para falar exigem o macOS 26 ou mais recente. Em versões anteriores do macOS, os controles ficam ocultos na página de configurações de Voz, que exibe o requisito do macOS 26.

## Modos

- **Modo de palavra de ativação** (padrão): um reconhecedor de fala sempre ativo aguarda tokens de ativação (`swabbleTriggerWords`). Quando há uma correspondência, ele inicia a captura, exibe a sobreposição com o texto parcial e envia automaticamente após um período de silêncio.
- **Pressione para falar (mantenha pressionada a tecla Option direita)**: mantenha pressionada a tecla Option direita para iniciar a captura imediatamente, sem precisar de uma palavra de ativação. A sobreposição aparece enquanto a tecla está pressionada; ao soltá-la, a captura é finalizada e encaminhada após um pequeno atraso, permitindo que você edite o texto.

## Comportamento em tempo de execução (palavra de ativação)

- O reconhecedor reside em `VoiceWakeRuntime`.
- A ativação ocorre somente quando há uma pausa significativa entre a palavra de ativação e a palavra seguinte (`triggerPauseWindow` = 0,55 s). A sobreposição e o aviso sonoro podem ser iniciados durante a pausa, antes mesmo do início do comando.
- Janelas de silêncio: 2,0 s (`silenceWindow`) enquanto a fala está fluindo; 5,0 s (`triggerOnlySilenceWindow`) se apenas a palavra de ativação tiver sido ouvida.
- Interrupção forçada: 120 s (`captureHardStop`) para evitar sessões descontroladas.
- Intervalo de estabilização entre sessões: 350 ms (`debounceAfterSend`) após um envio.
- A sobreposição é controlada por `VoiceWakeOverlayController`, com cores distintas para o texto confirmado e o texto temporário.
- Após o envio, o reconhecedor é reiniciado de forma limpa para aguardar a próxima ativação.

## Invariantes do ciclo de vida

- Se a ativação por voz estiver habilitada e as permissões tiverem sido concedidas, o reconhecedor da palavra de ativação permanecerá em escuta, exceto durante uma captura ativa de pressionar para falar.
- O fechamento da sobreposição, incluindo o fechamento manual pelo botão X, sempre retoma o reconhecedor: `VoiceSessionCoordinator.overlayDidDismiss` chama `VoiceWakeRuntime.refresh(state:)` em todos os caminhos de fechamento. Consulte [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay) para conhecer o modelo de sessão/token.

## Detalhes de pressionar para falar

- A detecção da tecla de atalho usa um monitor global de `.flagsChanged` para a tecla Option direita (`keyCode 61` + `.option`). Ele apenas observa os eventos, sem nunca bloqueá-los.
- A captura reside em `VoicePushToTalk`: inicia o reconhecimento de fala imediatamente, transmite resultados parciais para a sobreposição e chama `VoiceWakeForwarder` quando a tecla é solta.
- O início de pressionar para falar pausa o tempo de execução da palavra de ativação para evitar capturas de áudio concorrentes; ele é reiniciado automaticamente após a tecla ser solta.
- Permissões: exige acesso ao Microfone e ao Reconhecimento de Fala; o recebimento de eventos de teclado exige aprovação para Acessibilidade/Monitoramento de Entrada.
- Teclados externos: alguns não expõem a tecla Option direita conforme esperado. Ofereça um atalho alternativo caso os usuários relatem falhas de detecção.

## Configurações visíveis ao usuário

- Alternância **Ativação por voz**: habilita o tempo de execução da palavra de ativação.
- **Mantenha pressionada a tecla Option direita para falar**: habilita o monitor de pressionar para falar.
- Seletores de idioma e microfone, um medidor de nível em tempo real, uma tabela de palavras de ativação e uma ferramenta de teste (somente local, nunca encaminha).
- O seletor de microfone preserva a última seleção quando um dispositivo é desconectado, exibe um aviso de desconexão e usa temporariamente o dispositivo padrão do sistema até que o dispositivo retorne.
- **Sons**: avisos sonoros ao detectar a ativação e ao enviar, usando por padrão o som de sistema "Glass" do macOS. Selecione qualquer arquivo que possa ser carregado por `NSSound` (por exemplo, MP3/WAV/AIFF) para cada evento ou escolha **Sem som**.

## Comportamento de encaminhamento

- Ao encaminhar, `VoiceWakeForwarder.selectedSessionOptions` seleciona a chave da sessão ativa do WebChat, se houver uma definida; caso contrário, seleciona a chave da sessão principal do Gateway.
- Ele procura essa sessão por meio de `sessions.list` e obtém o canal e o destino de entrega a partir do contexto de entrega da sessão (usando como alternativas o último canal/destino e, depois, uma chave de sessão analisada), adotando o WebChat como padrão se nada for resolvido.
- Se a entrega falhar, o erro será registrado (categoria `voicewake.forward`), e a execução continuará visível por meio dos registros do WebChat/da sessão.

## Carga útil de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` adiciona uma linha de indicação para a máquina (nome do host resolvido, usando "este Mac" como alternativa) antes da transcrição, compartilhada entre os caminhos de palavra de ativação e de pressionar para falar.

## Verificação rápida

- Ative pressionar para falar, mantenha pressionada a tecla Option direita, fale e solte-a: a sobreposição deverá exibir os resultados parciais e, em seguida, enviar.
- Enquanto a tecla estiver pressionada, as orelhas da barra de menus deverão permanecer ampliadas (`triggerVoiceEars(ttl: nil)`); elas voltam ao tamanho normal após a tecla ser solta.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay)
- [Aplicativo para macOS](/pt-BR/platforms/macos)
