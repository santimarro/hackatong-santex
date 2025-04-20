import { useState, useEffect } from 'react';
import { addEmailToWhitelist, getWhitelistedEmails, removeEmailFromWhitelist } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertCircle, Check, Plus, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';

interface WhitelistEntry {
  id: string;
  email: string;
  notes: string | null;
  created_at: string;
  used: boolean;
  used_at: string | null;
}

export default function Admin() {
  const [emails, setEmails] = useState<WhitelistEntry[]>([]);
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load whitelisted emails
  const loadEmails = async () => {
    setLoading(true);
    try {
      const { data, error } = await getWhitelistedEmails();
      
      if (error) {
        throw error;
      }
      
      setEmails(data || []);
    } catch (err: any) {
      console.error('Error loading whitelisted emails:', err);
      setError(err.message || 'Failed to load whitelisted emails');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  // Add email to whitelist
  const handleAddEmail = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await addEmailToWhitelist(email, notes);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Email whitelisted",
        description: `${email} has been added to the whitelist`,
        variant: "success"
      });
      
      // Clear form and reload list
      setEmail('');
      setNotes('');
      setIsAddDialogOpen(false);
      await loadEmails();
    } catch (err: any) {
      console.error('Error adding email to whitelist:', err);
      setError(err.message || 'Failed to add email to whitelist');
    } finally {
      setLoading(false);
    }
  };

  // Remove email from whitelist
  const handleRemoveEmail = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the whitelist?`)) {
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await removeEmailFromWhitelist(id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Email removed",
        description: `${email} has been removed from the whitelist`,
        variant: "success"
      });
      
      await loadEmails();
    } catch (err: any) {
      console.error('Error removing email from whitelist:', err);
      
      toast({
        title: "Error",
        description: err.message || 'Failed to remove email from whitelist',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>
            Manage user access to Harvey by whitelisting email addresses
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end mb-6">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add Email
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Email to Whitelist</DialogTitle>
                  <DialogDescription>
                    Add an email address to allow user registration
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="notes" className="text-sm font-medium">
                      Notes (optional)
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Add any notes about this user..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddEmail}
                    disabled={loading || !email}
                  >
                    {loading ? 'Adding...' : 'Add Email'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Whitelisted Emails</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && emails.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No whitelisted emails found. Add your first email to allow user registration.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Used</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emails.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.email}</TableCell>
                          <TableCell>
                            {entry.used ? (
                              <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                                <Check className="h-3 w-3 mr-1" /> Used
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(entry.created_at)}</TableCell>
                          <TableCell>{formatDate(entry.used_at)}</TableCell>
                          <TableCell>{entry.notes || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveEmail(entry.id, entry.email)}
                              disabled={loading}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}