package main

import (
	"encoding/json"
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type User struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// 🔁 Conexión con retry
func connectRabbitMQ() *amqp.Connection {
	var conn *amqp.Connection
	var err error

	for {
		conn, err = amqp.Dial("amqp://guest:guest@rabbitmq:5672/")
		if err == nil {
			log.Println("✅ Connected to RabbitMQ")
			return conn
		}

		log.Println("⏳ Waiting for RabbitMQ...")
		time.Sleep(2 * time.Second)
	}
}

func main() {
	conn := connectRabbitMQ()
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal("❌ Failed to open channel:", err)
	}
	defer ch.Close()

	// ⚠️ IMPORTANTE: misma config que en Node
	_, err = ch.QueueDeclare(
		"user_created",
		false, // durable (debe coincidir con Node)
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("❌ Failed to declare queue:", err)
	}

	// 👇 Consumir directamente por nombre
	msgs, err := ch.Consume(
		"user_created",
		"",
		true, // auto-ack (simple para este caso)
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatal("❌ Failed to register consumer:", err)
	}

	log.Println("👂 Waiting for messages...")

	forever := make(chan bool)

	go func() {
		for msg := range msgs {
			log.Println("📩 Raw message:", string(msg.Body))

			var user User
			err := json.Unmarshal(msg.Body, &user)
			if err != nil {
				log.Println("❌ JSON parse error:", err)
				continue
			}

			log.Printf("🚀 Procesando usuario: %+v\n", user)
		}
	}()

	<-forever
}