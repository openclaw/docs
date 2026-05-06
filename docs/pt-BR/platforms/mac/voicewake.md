---
read_when:
    - Trabalhando em fluxos de ativação por voz ou PTT
summary: Modos de ativação por voz e pressionar para falar, além de detalhes de roteamento no app para Mac
title: Ativação por voz (macOS)
x-i18n:
    generated_at: "2026-05-06T09:05:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 312895b5767c447233bd77cbcd48ea81bb6c700080abc31974188b610a1b1ef0
    source_path: platforms/mac/voicewake.md
    workflow: 16
---

# Ativação por Voz e Pressione-para-Falar

## Modos

- **Modo de palavra de ativação** (padrão): o reconhecedor de fala sempre ativo aguarda tokens de acionamento (`swabbleTriggerWords`). Ao encontrar uma correspondência, ele inicia a captura, mostra a sobreposição com texto parcial e envia automaticamente após silêncio.
- **Pressione-para-falar (segurar Option direito)**: segure a tecla Option direita para capturar imediatamente, sem precisar de acionamento. A sobreposição aparece enquanto a tecla é segurada; soltar finaliza e encaminha após um curto atraso para que você possa ajustar o texto.

## Comportamento em runtime (palavra de ativação)

- O reconhecedor de fala fica em `VoiceWakeRuntime`.
- O acionamento só dispara quando há uma **pausa significativa** entre a palavra de ativação e a próxima palavra (intervalo de ~0,55 s). A sobreposição/som pode começar na pausa mesmo antes do comando começar.
- Janelas de silêncio: 2,0 s quando a fala está fluindo, 5,0 s se apenas o acionamento foi ouvido.
- Parada forçada: 120 s para evitar sessões descontroladas.
- Debounce entre sessões: 350 ms.
- A sobreposição é controlada via `VoiceWakeOverlayController` com coloração confirmada/volátil.
- Após o envio, o reconhecedor reinicia de forma limpa para escutar o próximo acionamento.

## Invariantes de ciclo de vida

- Se a Ativação por Voz estiver habilitada e as permissões tiverem sido concedidas, o reconhecedor de palavra de ativação deve estar escutando (exceto durante uma captura explícita de pressionar-para-falar).
- A visibilidade da sobreposição (incluindo dispensa manual pelo botão X) nunca deve impedir que o reconhecedor seja retomado.

## Modo de falha de sobreposição fixa (anterior)

Anteriormente, se a sobreposição ficasse travada visível e você a fechasse manualmente, a Ativação por Voz podia parecer "morta" porque a tentativa de reinício do runtime podia ser bloqueada pela visibilidade da sobreposição, e nenhum reinício subsequente era agendado.

Reforço:

- O reinício do runtime de ativação não é mais bloqueado pela visibilidade da sobreposição.
- A conclusão da dispensa da sobreposição aciona um `VoiceWakeRuntime.refresh(...)` via `VoiceSessionCoordinator`, então a dispensa manual pelo X sempre retoma a escuta.

## Especificidades de pressionar-para-falar

- A detecção de tecla de atalho usa um monitor global `.flagsChanged` para **Option direito** (`keyCode 61` + `.option`). Apenas observamos eventos (sem interceptá-los).
- O pipeline de captura fica em `VoicePushToTalk`: inicia o Speech imediatamente, transmite parciais para a sobreposição e chama `VoiceWakeForwarder` ao soltar.
- Quando pressionar-para-falar começa, pausamos o runtime de palavra de ativação para evitar capturas de áudio concorrentes; ele reinicia automaticamente após soltar.
- Permissões: requer Microfone + Speech; ver eventos exige aprovação de Acessibilidade/Monitoramento de Entrada.
- Teclados externos: alguns podem não expor o Option direito como esperado; ofereça um atalho alternativo se os usuários relatarem falhas.

## Configurações voltadas ao usuário

- Alternância **Ativação por Voz**: habilita o runtime de palavra de ativação.
- **Segurar Cmd+Fn para falar**: habilita o monitor de pressionar-para-falar. Desabilitado no macOS < 26.
- Seletores de idioma e microfone, medidor de nível ao vivo, tabela de palavras de acionamento, testador (somente local; não encaminha).
- O seletor de microfone preserva a última seleção se um dispositivo desconectar, mostra uma dica de desconectado e recorre temporariamente ao padrão do sistema até ele retornar.
- **Sons**: sons ao detectar acionamento e ao enviar; o padrão é o som do sistema macOS "Glass". Você pode escolher qualquer arquivo carregável por `NSSound` (por exemplo, MP3/WAV/AIFF) para cada evento ou escolher **Sem som**.

## Comportamento de encaminhamento

- Quando a Ativação por Voz está habilitada, as transcrições são encaminhadas para o Gateway/agente ativo (o mesmo modo local versus remoto usado pelo restante do app para Mac).
- As respostas são entregues ao **último provedor principal usado** (WhatsApp/Telegram/Discord/WebChat). Se a entrega falhar, o erro é registrado e a execução ainda fica visível via logs do WebChat/sessão.

## Payload de encaminhamento

- `VoiceWakeForwarder.prefixedTranscript(_:)` prefixa a dica da máquina antes de enviar. Compartilhado entre os caminhos de palavra de ativação e pressionar-para-falar.

## Verificação rápida

- Ative pressionar-para-falar, segure Cmd+Fn, fale, solte: a sobreposição deve mostrar parciais e então enviar.
- Enquanto estiver segurando, as orelhas na barra de menus devem permanecer ampliadas (usa `triggerVoiceEars(ttl:nil)`); elas diminuem após soltar.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Sobreposição de voz](/pt-BR/platforms/mac/voice-overlay)
- [App macOS](/pt-BR/platforms/macos)
