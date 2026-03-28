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
	for {
		conn := connectRabbitMQ()

		ch, err := conn.Channel()
		if err != nil {
			log.Println("Channel error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		q, err := ch.QueueDeclare(
			"user_created",
			false,
			false,
			false,
			false,
			nil,
		)
		if err != nil {
			log.Println("Queue error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		msgs, err := ch.Consume(
			q.Name,
			"",
			true,
			false,
			false,
			false,
			nil,
		)
		if err != nil {
			log.Println("Consume error:", err)
			time.Sleep(2 * time.Second)
			continue
		}

		log.Println("👂 Waiting for messages...")

		// canal de cierre
		forever := make(chan bool)

		go func() {
			for msg := range msgs {
				var user User
				json.Unmarshal(msg.Body, &user)

				log.Println("📩 Raw message:", string(msg.Body))
				log.Println("🚀 Procesando usuario:", user)
			}

			log.Println("❌ Connection lost, retrying...")
			forever <- true
		}()

		<-forever

		// cleanup
		ch.Close()
		conn.Close()

		log.Println("🔁 Reconnecting...")
		time.Sleep(2 * time.Second)
	}
}
