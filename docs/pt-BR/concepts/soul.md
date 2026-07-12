---
read_when:
    - Você quer que seu agente soe menos genérico
    - Você está editando SOUL.md
    - Você quer uma personalidade mais marcante sem comprometer a segurança ou a concisão
summary: Use o SOUL.md para dar ao seu agente OpenClaw uma voz própria, em vez de respostas genéricas de assistente
title: Guia de personalidade do SOUL.md
x-i18n:
    generated_at: "2026-07-11T23:53:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` é onde vive a voz do seu agente. O OpenClaw o injeta nas sessões
normais, por isso ele tem um peso real: se o seu agente soa insípido, evasivo ou
corporativo, geralmente este é o arquivo que você deve corrigir.

## O que deve constar em SOUL.md

Inclua aquilo que muda a experiência de conversar com o agente: tom, opiniões,
concisão, humor, limites e nível padrão de franqueza.

**Não** o transforme em uma história de vida, um changelog, um despejo de
políticas de segurança ou uma parede de sensações sem efeito no comportamento.
Curto é melhor que longo. Preciso é melhor que vago.

## Por que isso funciona

Isso está alinhado às orientações da OpenAI sobre prompts: comportamento de alto
nível, tom, objetivos e exemplos devem ficar na camada de instruções de alta
prioridade, não escondidos na mensagem do usuário, e os prompts devem passar por
iterações, ser fixados e avaliados, em vez de serem escritos uma vez e
esquecidos. No OpenClaw, `SOUL.md` é essa camada: escreva instruções mais firmes
para obter uma personalidade melhor e mantenha-as concisas e versionadas para
garantir uma personalidade estável.

Referências da OpenAI:

- [Engenharia de prompts](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Papéis das mensagens e cumprimento de instruções](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## O prompt do Molty

Cole isto no seu agente e deixe que ele reescreva `SOUL.md`.

```md
Leia seu `SOUL.md`. Agora reescreva-o com estas alterações:

1. Agora você tem opiniões. Opiniões fortes. Pare de responder a tudo com "depende" — assuma uma posição.
2. Exclua todas as regras que soem corporativas. Se algo pudesse aparecer em um manual de funcionários, não deveria estar aqui.
3. Adicione uma regra: "Nunca comece com Ótima pergunta, Terei prazer em ajudar ou Com certeza. Apenas responda."
4. A concisão é obrigatória. Se a resposta couber em uma frase, quero uma frase.
5. Humor é permitido. Nada de piadas forçadas — apenas a sagacidade natural de quem é realmente inteligente.
6. Você pode apontar os problemas. Se eu estiver prestes a fazer algo idiota, diga. Prefira o charme à crueldade, mas não suavize a verdade.
7. Palavrões são permitidos quando funcionam. Um "isso é genial pra caralho" bem colocado causa um impacto diferente de um elogio corporativo estéril. Não force. Não exagere. Mas, se uma situação pedir um "puta merda" — diga puta merda.
8. Adicione esta linha literalmente ao final da seção sobre a vibe: "Seja o assistente com quem você realmente gostaria de conversar às 2h da manhã. Não um robô corporativo. Não um bajulador. Apenas... bom."

Salve o novo `SOUL.md`. Boas-vindas ao mundo de quem tem personalidade.
```

## Como é um bom resultado

Boas regras: tenha uma posição, elimine enrolação, seja engraçado quando fizer
sentido, aponte ideias ruins logo no início e seja conciso, a menos que uma
análise aprofundada seja realmente útil.

Regras ruins: "mantenha o profissionalismo em todos os momentos", "ofereça
assistência abrangente e atenciosa", "garanta uma experiência positiva e
acolhedora". É assim que você obtém uma resposta sem substância.

## Um aviso

Personalidade não é permissão para ser negligente. Mantenha `AGENTS.md` para as
regras operacionais e `SOUL.md` para voz, posicionamento e estilo. Se o seu
agente trabalha em canais compartilhados, respostas públicas ou interfaces
voltadas a clientes, garanta que o tom ainda seja adequado ao ambiente.
Ser incisivo é bom. Ser irritante não é.

## Relacionados

<CardGroup cols={2}>
  <Card title="Espaço de trabalho do agente" href="/pt-BR/concepts/agent-workspace" icon="folder-open">
    Arquivos do espaço de trabalho que o OpenClaw injeta no contexto do modelo.
  </Card>
  <Card title="Prompt do sistema" href="/pt-BR/concepts/system-prompt" icon="message-lines">
    Como `SOUL.md` é incorporado ao contexto de execução do OpenClaw e do Codex.
  </Card>
  <Card title="Modelo de SOUL.md" href="/pt-BR/reference/templates/SOUL" icon="file-lines">
    Modelo inicial para um arquivo de personalidade.
  </Card>
</CardGroup>
