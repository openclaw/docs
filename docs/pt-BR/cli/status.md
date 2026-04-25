---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários de sessão recentes
    - Você quer um status “all” copiável para depuração
summary: Referência de CLI para `openclaw status` (diagnósticos, sondagens, snapshots de uso)
title: Status
x-i18n:
    generated_at: "2026-04-25T13:44:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
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

- `--deep` executa sondagens ativas (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` exibe janelas de uso normalizadas como `X% left`.
- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution` é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa se a sessão está usando `OpenClaw Pi Default`, `OpenAI Codex`, um backend CLI ou um backend ACP como `codex (acp/acpx)`. Consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes) para a distinção entre provedor/modelo/runtime.
- Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem têm precedência quando presentes. Respostas de `model_remains` priorizam a entrada do modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso de transcrição mais recente. Valores ativos existentes e não zero ainda têm precedência sobre valores de fallback da transcrição.
- O fallback de transcrição também pode recuperar o rótulo do modelo ativo do runtime quando a entrada ativa da sessão não o inclui. Se esse modelo da transcrição diferir do modelo selecionado, o status resolve a janela de contexto em relação ao modelo de runtime recuperado, e não ao modelo selecionado.
- Para contabilidade de tamanho de prompt, o fallback de transcrição prefere o total maior orientado a prompt quando metadados da sessão estão ausentes ou menores, para que sessões de provedor personalizado não caiam para exibições de `0` tokens.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui status de instalação/runtime do serviço Gateway + host Node quando disponível.
- A visão geral inclui canal de atualização + SHA git (para checkouts do código-fonte).
- Informações de atualização aparecem na Visão geral; se houver uma atualização disponível, o status exibe uma dica para executar `openclaw update` (consulte [Atualizando](/pt-BR/install/updating)).
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração de destino quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho de comando atual, o status permanece somente leitura e reporta saída degradada em vez de falhar. A saída legível por humanos mostra avisos como “configured token unavailable in this command path”, e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução local de SecretRef do comando tem êxito, o status prioriza o snapshot resolvido e remove marcadores transitórios de canal com “secret unavailable” da saída final.
- `status --all` inclui uma linha de visão geral de Segredos e uma seção de diagnóstico que resume diagnósticos de segredo (truncados para legibilidade) sem interromper a geração do relatório.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
