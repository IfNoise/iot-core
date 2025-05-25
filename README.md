# mqtt-core

Лёгкая и переносимая библиотека для реализации RPC-механизма поверх MQTT.

## Описание

`mqtt-core` — это библиотека для работы с удалёнными устройствами по MQTT с использованием паттерна RPC (Remote Procedure Call).  
Позволяет отправлять команды устройствам и получать ответы асинхронно через MQTT топики.

Идеально подходит для IoT-проектов и систем автоматизации, например, для управления каннабис-фермами, где важна надёжная и быстрая коммуникация с устройствами.

---

## Особенности

- Минимум зависимостей, написано на TypeScript
- Поддержка QoS 0, 1, 2
- Поддержка автоматического переподключения
- Асинхронные вызовы команд с таймаутом
- Легко интегрируется в серверные, клиентские и веб-приложения
- Возможность логирования событий и ошибок
- Простое расширение и кастомизация

---

## Установка

```bash
npm install mqtt-core
```

---

## Быстрый старт

```ts
import { MqttRpcClient } from "mqtt-core";
import { RpcRequest } from "mqtt-core/rpc-types";

const client = new MqttRpcClient({
  brokerUrl: "mqtt://broker.hivemq.com",
  deviceId: "device123",
  token: "your-jwt-token",
  qos: 1,
  logger: console,
});

client.onConnect(() => {
  console.log("MQTT подключён");
  client.onResponseTopic(); // Подписываемся на ответы от устройства
});

// Отправка команды с ожиданием ответа
const command: RpcRequest = {
  id: "12345",
  deviceId: "device123",
  command: "getStatus",
};

client
  .sendCommandAsync(command)
  .then((response) => {
    if (response.success) {
      console.log("Ответ устройства:", response.result);
    } else {
      console.error("Ошибка от устройства:", response.error);
    }
  })
  .catch((err) => {
    console.error("Ошибка RPC:", err);
  });
```

---

## API

### `new MqttRpcClient(options)`

- `options: MqttRpcClientOptions`

Параметры:

- `brokerUrl` — URL MQTT брокера.
- `deviceId` — уникальный ID устройства.
- `token` — JWT токен для аутентификации (опционально).
- `username` — имя пользователя для подключения (по умолчанию `'jwt'`).
- `qos` — QoS MQTT (0, 1 или 2).
- `willPayload` — payload для "Last Will" сообщения.
- `logger` — объект для логирования с методами `log`, `warn`, `error`.

---

### Методы

- `sendCommand(command: RpcRequest): void` — отправить команду (fire-and-forget).
- `sendCommandAsync(command: RpcRequest, timeout?: number): Promise<RpcResponse>` — отправить команду и дождаться ответа с таймаутом.
- `onConnect(callback: () => void): void` — установить обработчик успешного подключения.
- `onResponseTopic(): void` — подписаться на топик ответов.
- `isConnected(): boolean` — проверить статус подключения.
- `disconnect(force?: boolean): void` — отключиться от брокера.

---

## Типы

- `RpcRequest` — структура запроса команды.
- `RpcResponse` — структура ответа.
- `getRequestTopic(deviceId: string): string` — получить топик запроса.
- `getResponseTopic(deviceId: string): string` — получить топик ответа.

---

## Лицензия

MIT © intelligrow / IfNoise

---
