package main

import (
	"fmt"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Procesando request")
	w.WriteHeader(http.StatusOK)
}

func main() {
	http.HandleFunc("/process", handler)
	fmt.Println("Go service running")
	http.ListenAndServe(":8080", nil)
}
