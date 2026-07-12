---
read_when:
    - Você quer que um agente renderize um resultado interativo no chat da Web
    - Você precisa do contrato de entrada, segurança ou retenção de `show_widget`
sidebarTitle: Show widget
summary: Renderize widgets SVG ou HTML autocontidos diretamente no chat da web
title: Mostrar widget
x-i18n:
    generated_at: "2026-07-12T00:27:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` renderiza um fragmento SVG ou HTML autocontido diretamente na transcrição do chat da interface de controle. O Plugin Canvas incluído é responsável pela ferramenta e hospeda cada resultado como um documento Canvas da mesma origem.

A ferramenta só está disponível quando o cliente Gateway de origem declara a capacidade `inline-widgets`. A interface de controle declara essa capacidade automaticamente. Execuções em canais como Telegram e WhatsApp não recebem `show_widget`.

O transporte de capacidades abrange backends de modelos incorporados, baseados no servidor de aplicativos do Codex e baseados em CLI. Chamadores MCP autenticados por concessão e chamadores diretos de invocação de ferramentas via HTTP permanecem bloqueados por padrão, pois não declaram capacidades de cliente.

## Use a ferramenta

O agente fornece duas strings obrigatórias:

<ParamField path="title" type="string" required>
  Título curto exibido com a prévia incorporada e no título do documento hospedado.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Fragmento SVG ou HTML autocontido. A entrada que começa com `<svg` após a remoção de espaços em branco é renderizada no modo SVG; todas as outras entradas são tratadas como fragmentos HTML. Tamanho máximo: 262.144 caracteres.
</ParamField>

O resultado da ferramenta inclui um identificador de prévia do Canvas, portanto, o chat na web renderiza o widget diretamente a partir da chamada da ferramenta e o restaura após o recarregamento do histórico. As transcrições que não renderizam prévias ainda mostram o caminho do Canvas hospedado.

## Segurança e armazenamento

Os documentos de widget usam uma Política de Segurança de Conteúdo restritiva: estilos e scripts incorporados são permitidos, as imagens podem usar URLs `data:`, e buscas externas e carregamentos de recursos são bloqueados. Mantenha toda a marcação, os estilos, os scripts e os dados de imagem dentro de `widget_code`.

O iframe sempre omite `allow-same-origin`, mesmo quando o modo de incorporação global da interface de controle é `trusted`, portanto, os scripts do widget não podem ler a origem do aplicativo pai. O host do Canvas também fornece documentos de widget com um cabeçalho de resposta `Content-Security-Policy: sandbox allow-scripts`, portanto, abrir diretamente a URL hospedada ainda executa o widget em uma origem opaca, em vez da origem da interface de controle. O isolamento do navegador não impede que um script navegue seu próprio iframe; renderize apenas código de widget que você esteja disposto a executar nesse quadro isolado.

O iframe também segue [`gateway.controlUi.embedSandbox`](/pt-BR/web/control-ui#hosted-embeds). O nível padrão `scripts` oferece suporte a widgets interativos enquanto preserva o isolamento de origem.

O Canvas mantém no máximo 32 widgets por sessão (ou por agente quando nenhuma sessão está disponível). A criação de outro widget remove o documento mais antigo desse escopo.

## Relacionado

- [Incorporações hospedadas da interface de controle](/pt-BR/web/control-ui#hosted-embeds)
- [Plugin Canvas](/pt-BR/plugins/reference/canvas)
- [Capacidades de cliente do protocolo Gateway](/pt-BR/gateway/protocol#client-capabilities)
