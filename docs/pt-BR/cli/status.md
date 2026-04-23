---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários recentes da sessão
    - Você quer um status “all” fácil de colar para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, snapshots de uso)
title: status
x-i18n:
    generated_at: "2026-04-23T14:01:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 015614e329ec172a62c625581897fa64589f12dfe28edefe8a2764b5b5367b2a
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa sondagens ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` imprime janelas de uso normalizadas do provider como `X% left`.
- A saída de status da sessão agora separa `Runtime:` de `Runner:`. `Runtime` é o caminho de execução e o estado de sandbox (`direct`, `docker/*`), enquanto `Runner` informa se a sessão está usando Pi embutido, um provider com suporte de CLI ou um backend de harness ACP, como `codex (acp/acpx)`.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem têm prioridade quando presentes. Respostas de `model_remains` priorizam a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso da transcrição mais recente. Valores ativos e não zero existentes ainda têm prioridade sobre os valores de fallback da transcrição.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ao vivo não o contém. Se esse modelo da transcrição for diferente do modelo selecionado, o status resolve a janela de contexto com base no modelo de runtime recuperado em vez do selecionado.
- Para contabilidade do tamanho do prompt, o fallback da transcrição prioriza o maior total orientado a prompt quando os metadados da sessão estão ausentes ou são menores, para que sessões de provider personalizado não colapsem para exibições de `0` tokens.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do serviço Gateway + host Node quando disponível.
- A visão geral inclui canal de atualização + SHA do git (para checkouts de código-fonte).
- As informações de atualização aparecem na Visão geral; se uma atualização estiver disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualizando](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração de destino quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho de comando atual, o status permanece somente leitura e informa saída degradada em vez de falhar. A saída legível por humanos mostra avisos como “configured token unavailable in this command path”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução local ao comando de SecretRef for bem-sucedida, o status prioriza o snapshot resolvido e limpa marcadores transitórios de canal com “secret unavailable” da saída final.
- `status --all` inclui uma linha de visão geral de Secrets e uma seção de diagnóstico que resume diagnósticos de segredos (truncados para legibilidade) sem interromper a geração do relatório.
