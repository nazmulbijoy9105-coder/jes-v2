'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Religion } from '@/lib/types';
import { Moon, Sun, Cross, TreePine, AlertTriangle } from 'lucide-react';

interface ReligionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (religion: Religion) => void;
}

const religions = [
  { id: 'muslim' as Religion, name: 'Muslim', description: 'Islamic personal law', icon: Moon, color: 'bg-emerald-100 text-emerald-700' },
  { id: 'hindu' as Religion, name: 'Hindu', description: 'Hindu personal law', icon: Sun, color: 'bg-orange-100 text-orange-700' },
  { id: 'christian' as Religion, name: 'Christian', description: 'Christian personal law', icon: Cross, color: 'bg-blue-100 text-blue-700' },
  { id: 'adibashi' as Religion, name: 'Adibashi', description: 'Indigenous customary law', icon: TreePine, color: 'bg-purple-100 text-purple-700' }
];

export function ReligionModal({ isOpen, onClose, onSelect }: ReligionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Required for Family Law</span>
          </div>
          <DialogTitle>Select Your Personal Law System</DialogTitle>
          <DialogDescription>
            Bangladesh operates parallel personal law systems. Rules for marriage, divorce, inheritance, and custody differ by religion.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 mt-4">
          {religions.map((religion) => {
            const Icon = religion.icon;
            return (
              <Button
                key={religion.id}
                variant="outline"
                className="justify-start h-auto py-4 px-4 hover:bg-gray-50"
                onClick={() => onSelect(religion.id)}
              >
                <div className={`w-10 h-10 rounded-lg ${religion.color} flex items-center justify-center mr-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{religion.name}</div>
                  <div className="text-sm text-gray-500">{religion.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}