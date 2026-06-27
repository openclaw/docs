---
read_when:
    - Você quer um diagnóstico rápido da integridade do canal + destinatários de sessões recentes
    - Você quer um status "all" colável para depuração
summary: Referência da CLI para `openclaw status` (diagnósticos, sondagens, instantâneos de uso)
title: openclaw status
x-i18n:
    generated_at: "2026-06-27T17:22:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aeb9e99b2aa9eb12fe97c8ee018ac6a5227cad990d151c3579d16009c5b9258a
    source_path: cli/status.md
    workflow: 16
---

Diagnósticos para canais + sessões.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Observações:

- `--deep` executa sondagens ao vivo (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `openclaw status` simples permanece no caminho rápido somente leitura e marca a memória como `not checked` em vez de indisponível quando pula a inspeção de memória. Auditoria de segurança pesada, compatibilidade de Plugin e sondagens de vetor de memória ficam para `openclaw status --all`, `openclaw status --deep`, `openclaw security audit` e `openclaw memory status --deep`.
- `status --json --all` relata detalhes de memória do runtime do plugin de memória ativo selecionado por `plugins.slots.memory`. Plugins de memória personalizados podem deixar o `agents.defaults.memorySearch.enabled` integrado desativado e ainda relatar seus próprios arquivos, chunks, vetor e estado FTS.
- `--usage` imprime janelas de uso normalizadas do provedor como `X% left`.
- A saída de status da sessão separa `Execution:` de `Runtime:`. `Execution` é o caminho do sandbox (`direct`, `docker/*`), enquanto `Runtime` informa se a sessão está usando `OpenClaw Default`, `OpenAI Codex`, um backend de CLI ou um backend ACP, como `codex (acp/acpx)`. Consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes) para a distinção entre provedor/modelo/runtime.
- Os campos brutos `usage_percent` / `usagePercent` da MiniMax representam a cota restante, então o OpenClaw os inverte antes da exibição; campos baseados em contagem têm prioridade quando presentes. Respostas `model_remains` preferem a entrada de modelo de chat, derivam o rótulo da janela a partir de timestamps quando necessário e incluem o nome do modelo no rótulo do plano.
- Quando o snapshot da sessão atual é esparso, `/status` pode preencher contadores de tokens e cache a partir do log de uso de transcrição mais recente. Valores ao vivo não zero existentes ainda têm prioridade sobre valores de fallback da transcrição.
- `/status` inclui uptime compacto do processo Gateway e uptime do sistema host.
- O fallback da transcrição também pode recuperar o rótulo do modelo de runtime ativo quando a entrada da sessão ao vivo não o contém. Se esse modelo da transcrição diferir do modelo selecionado, o status resolve a janela de contexto com base no modelo de runtime recuperado, em vez do selecionado.
- Quando uma sessão está fixada a um modelo que difere do primário configurado, o status imprime ambos os valores, o motivo (`session override`) e a dica clara (`/model default`). O primário configurado se aplica a sessões novas ou não fixadas; sessões fixadas existentes mantêm sua seleção de sessão até que ela seja limpa.
- Para a contabilização do tamanho do prompt, o fallback da transcrição prefere o total maior orientado a prompt quando os metadados da sessão estão ausentes ou são menores, então sessões de provedores personalizados não colapsam para exibições de `0` tokens.
- A saída inclui armazenamentos de sessão por agente quando vários agentes estão configurados.
- A visão geral inclui o status de instalação/runtime do Gateway + serviço host do Node quando disponível.
- A visão geral inclui o canal de atualização + SHA do git (para checkouts de origem).
- Informações de atualização aparecem na Visão geral; se houver uma atualização disponível, o status imprime uma dica para executar `openclaw update` (consulte [Atualização](/pt-BR/install/updating)).
- Falhas de atualização de preços de modelos são mostradas como avisos opcionais de preços. Elas não significam que o Gateway ou os canais estejam sem integridade.
- Superfícies de status somente leitura (`status`, `status --json`, `status --all`) resolvem SecretRefs compatíveis para seus caminhos de configuração direcionados quando possível.
- Se um SecretRef de canal compatível estiver configurado, mas indisponível no caminho do comando atual, o status permanece somente leitura e relata saída degradada em vez de falhar. A saída humana mostra avisos como "token configurado indisponível neste caminho de comando", e a saída JSON inclui `secretDiagnostics`.
- Quando a resolução de SecretRef local ao comando é bem-sucedida, o status prefere o snapshot resolvido e limpa marcadores transitórios de "secret unavailable" do canal da saída final.
- `status --all` inclui uma linha de visão geral de Segredos e uma seção de diagnóstico que resume diagnósticos de segredos (truncados para legibilidade) sem interromper a geração do relatório.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Doctor](/pt-BR/gateway/doctor)
