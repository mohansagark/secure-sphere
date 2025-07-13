"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  CreditCard as CreditCardIcon,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { CreditCard } from "@/types";

export const CreditCardManager: React.FC = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCardNumbers, setShowCardNumbers] = useState(false);
  const [formData, setFormData] = useState<{
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    bankName: string;
    nickname: string;
    cardType: "visa" | "mastercard" | "amex" | "discover" | "other";
    isDefault: boolean;
  }>({
    cardNumber: "",
    cardholderName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    bankName: "",
    nickname: "",
    cardType: "visa",
    isDefault: false,
  });

  const fetchCards = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/credit-cards?userId=${user.uid}`);
      if (response.ok) {
        const cardsData = await response.json();
        setCards(cardsData);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user, fetchCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch("/api/credit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId: user.uid }),
      });

      if (response.ok) {
        await fetchCards();
        setShowAddForm(false);
        setFormData({
          cardNumber: "",
          cardholderName: "",
          expiryMonth: "",
          expiryYear: "",
          cvv: "",
          bankName: "",
          nickname: "",
          cardType: "visa",
          isDefault: false,
        });
      }
    } catch (error) {
      console.error("Error adding card:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!user || !confirm("Are you sure you want to delete this card?")) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/credit-cards?id=${cardId}&userId=${user.uid}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        await fetchCards();
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    } finally {
      setLoading(false);
    }
  };

  const maskCardNumber = (cardNumber: string) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CreditCardIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Credit Cards
          </h1>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Add Card Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Credit Card</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              label="Card Number"
              value={formData.cardNumber}
              onChange={(e) =>
                setFormData({ ...formData, cardNumber: e.target.value })
              }
              placeholder="1234 5678 9012 3456"
              required
            />
            <Input
              label="Cardholder Name"
              value={formData.cardholderName}
              onChange={(e) =>
                setFormData({ ...formData, cardholderName: e.target.value })
              }
              placeholder="John Doe"
              required
            />
            <Input
              label="Expiry Month"
              value={formData.expiryMonth}
              onChange={(e) =>
                setFormData({ ...formData, expiryMonth: e.target.value })
              }
              placeholder="MM"
              maxLength={2}
              required
            />
            <Input
              label="Expiry Year"
              value={formData.expiryYear}
              onChange={(e) =>
                setFormData({ ...formData, expiryYear: e.target.value })
              }
              placeholder="YYYY"
              maxLength={4}
              required
            />
            <Input
              label="CVV"
              value={formData.cvv}
              onChange={(e) =>
                setFormData({ ...formData, cvv: e.target.value })
              }
              placeholder="123"
              maxLength={4}
              required
            />
            <Input
              label="Bank Name"
              value={formData.bankName}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
              placeholder="Chase Bank"
            />
            <Input
              label="Nickname"
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              placeholder="Personal Card"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Card Type
              </label>
              <select
                value={formData.cardType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cardType: e.target.value as typeof formData.cardType,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="discover">Discover</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                Add Card
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Cards</h2>
          <Button
            variant="ghost"
            onClick={() => setShowCardNumbers(!showCardNumbers)}
            size="sm"
          >
            {showCardNumbers ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showCardNumbers ? "Hide" : "Show"} Numbers
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No credit cards added yet. Add your first card to get started.
          </div>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                    <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {card.nickname ||
                        `${card.bankName} ${card.cardType.toUpperCase()}`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {showCardNumbers
                        ? card.cardNumber
                        : maskCardNumber(card.cardNumber)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.cardholderName} • Expires {card.expiryMonth}/
                      {card.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCard(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
